// src/ai/ai.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { SummarizeRequestDto, SummarizeResponseDto } from './dto/summarize-accomplishments.dto';

/* -------------------- Schema (single source of truth) -------------------- */
const SummaryZ = z.object({
  users: z.array(
    z.object({
      badge: z.number(),
      name: z.string(),
      summary_md: z.string().describe('Concise Markdown bullets (3–8) of shipped work & impact.'),
      highlights: z.array(z.string()).optional(),
      blockers: z.array(z.string()).optional(),
      next_focus: z.array(z.string()).optional(),
    })
  ),
  team_themes: z.array(z.string()).optional(),
});
type SummaryZType = z.infer<typeof SummaryZ>;

/* -------------------- Service -------------------- */
@Injectable()
export class AiService {
  private readonly model: string;
  private readonly baseURL: string;

  constructor(private readonly client: OpenAI, cfg: ConfigService) {
    this.model = cfg.get<string>('SUMMARY_MODEL') || 'gemini-2.5-flash';
    this.baseURL = cfg.get<string>('OPENAI_BASE_URL') || '';
  }

  private get isGemini(): boolean {
    return this.baseURL.includes('generativelanguage.googleapis.com');
  }

  /** Extra safety in case HTML sneaks in */
  private toPlain(input: string): string {
    if (!input) return '';
    return input
      .replace(/<[^>]+>/g, ' ')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private buildCorpus(dto: SummarizeRequestDto): string {
    const { from, to, users } = dto;
    return users
      .map((u) => {
        const lines = (u.entries || [])
          .filter((e) => e?.text && e.text.trim())
          .map(
            (e) =>
              `- (${e.startWeekDate}→${e.endWeekDate}) ${this.toPlain(e.text).slice(0, 2000)}`
          );
        return `User: ${u.name} (#${u.badge})\nWindow: ${from} → ${to}\nAccomplishments:\n${
          lines.length ? lines.join('\n') : '- (none)'
        }\n`;
      })
      .join('\n');
  }

  /** Find the first top-level JSON object in a string (fallback path). */
  private extractFirstJson(s: string): string {
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start >= 0 && end > start) return s.slice(start, end + 1);
    throw new Error('No JSON object found in model output');
  }

  /** Try to coerce "creative" provider JSON into our schema before failing */
  private normalizeToSchema(raw: any): SummaryZType {
    // If already correct, accept
    try {
      return SummaryZ.parse(raw);
    } catch {
      /* fall through */
    }

    // 1) Alternate: { team_roll_up: { individual_summaries: [...], team_themes? } }
    if (
      raw?.team_roll_up?.individual_summaries &&
      Array.isArray(raw.team_roll_up.individual_summaries)
    ) {
      const users = raw.team_roll_up.individual_summaries.map((u: any) => {
        const idStr = String(u.employee_id ?? u.badge ?? '').trim();
        const badge = Number(String(idStr).replace(/[^\d]/g, '')) || 0;
        const name = u.name ?? u.employee_name ?? 'Unknown';
        const summary_md = u.summary ?? u.summary_md ?? '';
        return { badge, name, summary_md };
      });
      const mapped: any = {
        users,
        team_themes: Array.isArray(raw.team_roll_up.team_themes)
          ? raw.team_roll_up.team_themes
          : undefined,
      };
      return SummaryZ.parse(mapped);
    }

    // 2) Alternate: { individuals: [{ id/name/summary }], themes?: [] }
    if (Array.isArray(raw?.individuals)) {
      const users = raw.individuals.map((u: any) => ({
        badge: Number(String(u.id ?? u.badge ?? '').replace(/[^\d]/g, '')) || 0,
        name: u.name ?? 'Unknown',
        summary_md: u.summary ?? u.summary_md ?? '',
      }));
      const mapped: any = {
        users,
        team_themes: Array.isArray(raw.themes) ? raw.themes : undefined,
      };
      return SummaryZ.parse(mapped);
    }

    // 3) Alternate: array of { name, summary } at the top
    if (Array.isArray(raw) && raw.length && (raw[0].name || raw[0].summary || raw[0].summary_md)) {
      const users = raw.map((u: any, idx: number) => ({
        badge:
          Number(String(u.badge ?? idx + 1).toString().replace(/[^\d]/g, '')) || idx + 1,
        name: u.name ?? 'Unknown',
        summary_md: u.summary ?? u.summary_md ?? '',
      }));
      return SummaryZ.parse({ users });
    }

    // Give up: throw with a helpful preview
    const preview = typeof raw === 'string' ? raw.slice(0, 400) : JSON.stringify(raw).slice(0, 400);
    throw new Error(`Provider returned unexpected JSON shape; preview: ${preview}`);
  }

  async summarize(dto: SummarizeRequestDto): Promise<SummarizeResponseDto> {
    const system = [
      'You help a manager prepare monthly roll-ups of weekly accomplishments.',
      'Summarize each person for the date range; prefer outcomes/impact, merge duplicates, avoid trivia.',
      'Return ONLY JSON with keys "users" and optional "team_themes". No other keys, no wrapping objects.',
      'Each users[i] must have: badge (number), name (string), summary_md (string).',
      'Do not invent numbers or facts.',
    ].join(' ');

    const input = [
      `Date window: ${dto.from} → ${dto.to}`,
      dto.includeTeamSummary !== false
        ? 'Also extract 3–7 cross-cutting team themes.'
        : 'Team themes not required.',
      'DATA START',
      this.buildCorpus(dto),
      'DATA END',
    ].join('\n');

    try {
      if (this.isGemini) {
        /* ---------- Gemini (OpenAI-compatible) path ---------- */
        try {
          // Primary attempt: ask for JSON object
          const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: input },
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
            // Note: omit seed/top_p for Gemini compat
          });

          const content: any = completion.choices?.[0]?.message?.content ?? '';
          const text = Array.isArray(content)
            ? content.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('')
            : String(content);

          const obj = JSON.parse(text);
          const normalized = this.normalizeToSchema(obj);
          return normalized as SummarizeResponseDto;
        } catch (e1: any) {
          const status = e1?.status || e1?.response?.status;
          const data = e1?.response?.data || e1?.message;
          console.error('[AI summarize][Gemini primary] FAILED', { status, data });

          // Fallback: no response_format; extract JSON from text
          const fallback = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: system },
              {
                role: 'user',
                content: input + '\nReturn ONLY a valid JSON object for { "users": [...], "team_themes"?: [...] }.',
              },
            ],
            temperature: 0,
          });

          const content2: any = fallback.choices?.[0]?.message?.content ?? '';
          const text2 = Array.isArray(content2)
            ? content2.map((c: any) => (typeof c === 'string' ? c : c?.text ?? '')).join('')
            : String(content2);

          const jsonText = this.extractFirstJson(text2);
          const obj2 = JSON.parse(jsonText);
          const normalized2 = this.normalizeToSchema(obj2);
          return normalized2 as SummarizeResponseDto;
        }
      }

      /* ---------- OpenAI/Groq/etc. path (supports parse + json_schema) ---------- */
      const completion = await this.client.chat.completions.parse({
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: input },
        ],
        response_format: zodResponseFormat(SummaryZ, 'AccomplishmentSummaries'),
        temperature: 0,
      });

      const parsed = completion.choices?.[0]?.message?.parsed as SummaryZType;
      return parsed as SummarizeResponseDto;
    } catch (err: any) {
      const provider = this.isGemini ? 'Gemini(OpenAI-compat)' : 'OpenAI-like';
      const status = err?.status || err?.response?.status;
      const data = err?.response?.data || err?.error || err?.message || err;
      console.error(`[AI summarize][${provider}] FAILED`, { status, data });
      throw new InternalServerErrorException('Summarization failed');
    }
  }
}
