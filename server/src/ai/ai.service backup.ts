// src/ai/ai.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  HttpException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  SummarizeRequestDto,
  SummarizeResponseDto,
} from "./dto/summarize-accomplishments.dto";

/* -------------------- Schema (single source of truth) -------------------- */
/**
 * badge is coerced so model output like "87100" still validates.
 * team_themes is optional (matches your DTO).
 */
const SummaryZ = z.object({
  users: z.array(
    z.object({
      badge: z.coerce.number().int().nonnegative(),
      name: z.string(),
      summary_md: z.string(),
      highlights: z.array(z.string()).optional(),
      blockers: z.array(z.string()).optional(),
      next_focus: z.array(z.string()).optional(),
    })
  ),
  team_themes: z.array(z.string()).optional(),
});

type SummaryZType = z.infer<typeof SummaryZ>;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private readonly model: string;
  private readonly baseURL: string;

  constructor(private readonly client: OpenAI, cfg: ConfigService) {
    this.model = (
      cfg.get<string>("SUMMARY_MODEL") || "gemini-2.5-flash"
    ).trim();
    this.baseURL = (cfg.get<string>("OPENAI_BASE_URL") || "").trim();

    this.logger.log(
      `Config: model=${this.model}, baseURL=${
        this.baseURL || "(empty)"
      }, isGemini=${this.isGemini}`
    );
  }

  private get isGemini(): boolean {
    return this.baseURL.includes("generativelanguage.googleapis.com");
  }

  /** Extra safety in case HTML sneaks in */
  private toPlain(input: string): string {
    if (!input) return "";
    return input
      .replace(/<[^>]+>/g, " ")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\s+/g, " ")
      .trim();
  }

  private buildCorpus(dto: SummarizeRequestDto): string {
    const { from, to, users } = dto;

    return (users ?? [])
      .map((u) => {
        const lines = (u.entries ?? [])
          .filter((e) => e?.text && e.text.trim())
          .map(
            (e) =>
              `- (${e.startWeekDate}→${e.endWeekDate}) ${this.toPlain(
                e.text
              ).slice(0, 2000)}`
          );

        return [
          `User: ${u.name} (#${u.badge})`,
          `Role: ${u.role}`,
          `Cost Center: ${u.costCenter}`,
          `Window: ${from} → ${to}`,
          `Accomplishments:`,
          lines.length ? lines.join("\n") : "- (none)",
          "",
        ].join("\n");
      })
      .join("\n");
  }

  /** Find the first top-level JSON object in a string (fallback path). */
  private extractFirstJson(s: string): string {
    const start = s.indexOf("{");
    const end = s.lastIndexOf("}");
    if (start >= 0 && end > start) return s.slice(start, end + 1);
    throw new Error("No JSON object found in model output");
  }

  private parseAndNormalizeModelOutput(text: string): SummarizeResponseDto {
    // Try direct JSON
    try {
      const obj = JSON.parse(text);
      return SummaryZ.parse(obj) as SummarizeResponseDto;
    } catch {
      // Try extracting JSON from surrounding text
      const jsonText = this.extractFirstJson(text);
      const obj2 = JSON.parse(jsonText);
      return SummaryZ.parse(obj2) as SummarizeResponseDto;
    }
  }

  // private buildSystemPrompt(includeTeamSummary: boolean): string {
  //   const base = [
  //     "You are an expert at creating concise executive summaries of weekly accomplishments.",
  //     "For each person, produce 2–5 Markdown bullet points focusing on outcomes and impact.",
  //     "Merge duplicates and ignore trivial tasks.",
  //     "Do NOT invent facts or numbers.",
  //     "Return ONLY valid JSON (no code fences, no prose).",
  //     'Top-level JSON must be: {"users":[...]}',
  //     "Each user must include: badge (number), name (string), summary_md (string).",
  //   ];

  //   if (includeTeamSummary) {
  //     base.push(
  //       'Also include optional key "team_themes": string[] (3–8 bullets) capturing cross-team themes.'
  //     );
  //   }

  //   return base.join(" ");
  // }
  private buildSystemPrompt(includeTeamSummary: boolean): string {
    const base = [
      "You are an expert at creating concise executive summaries of weekly accomplishments.",
      "Input is JSON containing a date window and a list of users with badge, name, role, costCenter, and weekly entries.",

      "First, produce per-person summaries:",
      "For each person, produce 2–5 Markdown bullet points focusing on outcomes and impact.",
      "Merge duplicates and ignore trivial tasks.",
      "Do NOT invent facts or numbers.",

      "This request is for a single team view, but the output format must match the multi-team format for a shared UI.",

      "Determine the team (costCenter) as follows:",
      "1) If there is a user whose role is exactly 'manager', use that manager's costCenter as the team costCenter.",
      "2) Otherwise, if all users share the same costCenter, use that costCenter.",
      "3) Otherwise (multiple cost centers and no manager), choose the lowest numeric costCenter.",

      "If multiple managers exist for the chosen costCenter, choose the manager with the lowest badge number.",

      "Return ONLY valid JSON (no code fences, no prose).",
      'Top-level JSON must be exactly: {"teams":[...]}',
      "Output must include exactly ONE team object in teams[].",
      "Each team object must include:",
      "- costCenter: number",
      '- manager: { badge: number, name: string } (if no manager exists, use { badge: 0, name: "N/A" })',
      "- users: [{ badge: number, name: string, summary_md: string }]",
    ];

    if (includeTeamSummary) {
      base.push(
        "Also include team-level summary fields for that single team:",
        "- team_summary: 1–3 sentences focusing on outcomes and impact.",
        "- team_themes: string[] with 3–8 short bullets capturing cross-team themes within the team."
      );
    }

    return base.join(" ");
  }

  async summarize(dto: SummarizeRequestDto): Promise<SummarizeResponseDto> {
    const includeTeamSummary = dto.includeTeamSummary ?? true;

    const system = this.buildSystemPrompt(includeTeamSummary);

    const input = [
      `Date window: ${dto.from} → ${dto.to}`,
      `includeTeamSummary: ${includeTeamSummary}`,
      "DATA START",
      this.buildCorpus(dto),
      "DATA END",
      "",
      'Return ONLY JSON matching: {"users":[{"badge":87100,"name":"...","summary_md":"- ..."}], "team_themes":["..."]}',
    ].join("\n");

    try {
      if (this.isGemini) {
        // ✅ Gemini OpenAI-compat path:
        // IMPORTANT: do NOT send response_format for Gemini. We prompt for JSON and parse it ourselves.
        try {
          const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: input },
            ],
            temperature: 0,
          });

          const content: any = completion.choices?.[0]?.message?.content ?? "";
          const text = Array.isArray(content)
            ? content
                .map((c: any) => (typeof c === "string" ? c : c?.text ?? ""))
                .join("")
            : String(content);

          return this.parseAndNormalizeModelOutput(text);
        } catch (e1: any) {
          const status = e1?.status || e1?.response?.status;
          const data = e1?.response?.data || e1?.message;
          this.logger.error(
            "[Gemini primary] failed",
            JSON.stringify({ status, data })
          );

          // Fallback: stricter JSON-only instruction
          const fallback = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: "system", content: system },
              {
                role: "user",
                content:
                  input +
                  "\n\nSTRICT OUTPUT RULES:\n- Output ONLY JSON\n- No markdown fences\n- No explanations\n",
              },
            ],
            temperature: 0,
          });

          const content2: any = fallback.choices?.[0]?.message?.content ?? "";
          const text2 = Array.isArray(content2)
            ? content2
                .map((c: any) => (typeof c === "string" ? c : c?.text ?? ""))
                .join("")
            : String(content2);

          return this.parseAndNormalizeModelOutput(text2);
        }
      }

      // OpenAI / other providers path (structured output supported)
      const completion = await this.client.chat.completions.parse({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input },
        ],
        response_format: zodResponseFormat(SummaryZ, "AccomplishmentSummaries"),
        temperature: 0,
      });

      const parsed = completion.choices?.[0]?.message?.parsed as SummaryZType;
      return parsed as SummarizeResponseDto;
    } catch (err: any) {
      const provider = this.isGemini ? "Gemini(OpenAI-compat)" : "OpenAI-like";
      const status = err?.status || err?.response?.status;
      const data = err?.response?.data || err?.error || err?.message || err;

      this.logger.error(
        `[AI summarize][${provider}] FAILED`,
        JSON.stringify({ status, data })
      );

      if (status === 400)
        throw new BadRequestException("AI request rejected (400).");
      if (status === 401 || status === 403)
        throw new ForbiddenException("AI request rejected (auth/permission).");
      if (status === 404)
        throw new NotFoundException(
          "AI resource not found (check model/baseURL)."
        );

      // ✅ portable 429 handling for older Nest versions
      if (status === 429)
        throw new HttpException("AI rate-limited (429).", 429);

      throw new InternalServerErrorException("Summarization failed");
    }
  }
  // team summary methods
  private extractJsonObject(text: string): any {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0 || end <= start) {
      throw new Error("Model did not return a JSON object.");
    }
    const raw = text.slice(start, end + 1);
    return JSON.parse(raw);
  }

  private normalizeTeamThemes(obj: any): { team_themes: string[] } {
    const themes = obj?.team_themes;
    if (!Array.isArray(themes)) return { team_themes: [] };

    // Clean + clamp 3–8 (and remove empties / duplicates)
    const cleaned = themes
      .map((s) => String(s).trim())
      .filter((s) => s.length > 0);

    const deduped: string[] = [];
    for (const t of cleaned) {
      if (!deduped.some((x) => x.toLowerCase() === t.toLowerCase()))
        deduped.push(t);
    }

    return { team_themes: deduped.slice(0, 8) };
  }
  // private buildTeamSummaryPrompt(): string {
  //   return [
  //     "You are an expert at creating concise executive summaries of weekly accomplishments across a team.",
  //     "Read all accomplishments across all users and produce cross-team themes.",
  //     "Focus on outcomes, impact, and notable initiatives; merge duplicates; ignore trivial tasks.",
  //     "Do NOT invent facts or numbers.",
  //     "Return ONLY valid JSON (no code fences, no prose).",
  //     'Top-level JSON must be: {"team_themes":[...]}',
  //     "team_themes must be 5–10 short bullets (strings).",
  //   ].join(" ");
  // }
  private buildTeamSummaryPrompt(): string {
    return [
      "You are an expert at creating concise executive summaries of weekly accomplishments across multiple teams.",
      "Input is JSON containing a date window and a list of users with badge, name, role, costCenter, and weekly entries.",

      "Group users by costCenter. Each costCenter represents one team.",

      "For each costCenter, identify the manager as the user whose role is exactly 'manager'.",
      "If multiple managers exist in the same costCenter, choose the manager with the lowest badge number.",
      "If a costCenter has no manager, omit that costCenter entirely from the output.",

      "For each included costCenter, read all entries from all users in that costCenter within the date window.",
      "Produce a concise team_summary (1–3 sentences) focusing on outcomes, impact, and notable initiatives.",
      "Produce team_themes as 5–10 short bullet strings capturing cross-user initiatives for that team.",

      "Merge duplicate efforts and ignore trivial or test entries.",
      "Do NOT invent facts, systems, timelines, or numbers that are not present in the input.",

      "Return ONLY valid JSON (no code fences, no markdown, no prose).",
      'Top-level JSON must be exactly: {"teams":[...]}',
      "Each team object must have the following shape:",
      '{ "costCenter": number, "manager": { "badge": number, "name": string }, "team_summary": string, "team_themes": string[] }',
    ].join(" ");
  }
  async summarizeTeamThemes(
    dto: SummarizeRequestDto
  ): Promise<{ team_themes: string[] }> {
    const system = this.buildTeamSummaryPrompt();

    const input = [
      `Date window: ${dto.from} → ${dto.to}`,
      "DATA START",
      this.buildCorpus(dto),
      "DATA END",
      "",
      //'Return ONLY JSON matching: {"team_themes":["...","..."]}',
    ].join("\n");
    console.log("AI Service - summarizeTeamThemes called with input:", input);
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: input },
        ],
        temperature: 0,
      });

      const content: any = completion.choices?.[0]?.message?.content ?? "";
      const text = Array.isArray(content)
        ? content
            .map((c: any) => (typeof c === "string" ? c : c?.text ?? ""))
            .join("")
        : String(content);
      console.log("AI Service - summarizeTeamThemes received content:", text);
      const parsed = this.extractJsonObject(text);
      return this.normalizeTeamThemes(parsed);
    } catch (err: any) {
      const provider = this.isGemini ? "Gemini(OpenAI-compat)" : "OpenAI-like";
      const status = err?.status || err?.response?.status;
      const data = err?.response?.data || err?.error || err?.message || err;

      this.logger.error(
        `[AI summarizeTeamThemes][${provider}] FAILED`,
        JSON.stringify({ status, data })
      );

      if (status === 400)
        throw new BadRequestException("AI request rejected (400).");
      if (status === 401 || status === 403)
        throw new ForbiddenException("AI request rejected (auth/permission).");
      if (status === 404)
        throw new NotFoundException(
          "AI resource not found (check model/baseURL)."
        );
      if (status === 429)
        throw new HttpException("AI rate-limited (429).", 429);

      throw new InternalServerErrorException(
        "Team themes summarization failed"
      );
    }
  }
}
