// src/ai/ai.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { SummarizeRequestDto, SummarizeResponseDto } from './dto/summarize-accomplishments.dto';

const SummaryZ = z.object({
  users: z.array(z.object({
    badge: z.number(),
    name: z.string(),
    summary_md: z.string(),           // 3–8 concise bullets in Markdown
    highlights: z.array(z.string()).optional(),
    blockers: z.array(z.string()).optional(),
    next_focus: z.array(z.string()).optional(),
  })),
  team_themes: z.array(z.string()).optional(),
});
type SummaryZType = z.infer<typeof SummaryZ>;

@Injectable()
export class AiService {
  private readonly model: string;
  constructor(private readonly client: OpenAI, cfg: ConfigService) {
    this.model = cfg.get<string>('SUMMARY_MODEL') || 'gemini-2.5-flash';
  }

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
    return users.map(u => {
      const lines = (u.entries || [])
        .filter(e => e?.text && e.text.trim())
        .map(e => `- (${e.startWeekDate}→${e.endWeekDate}) ${this.toPlain(e.text).slice(0, 2000)}`);
      return `User: ${u.name} (#${u.badge})\nWindow: ${from} → ${to}\nAccomplishments:\n${lines.length ? lines.join('\n') : '- (none)'}\n`;
    }).join('\n');
  }

  async summarize(dto: SummarizeRequestDto): Promise<SummarizeResponseDto> {
    const system = [
      'You help a manager prepare monthly roll-ups of weekly accomplishments.',
      'Summarize each person for the date range; prefer outcomes/impact, merge duplicates, avoid trivia.',
      'Don’t invent numbers or facts. Return only the structured JSON requested.',
    ].join(' ');

    const input = [
      `Date window: ${dto.from} → ${dto.to}`,
      dto.includeTeamSummary !== false ? 'Also extract 3–7 cross-cutting team themes.' :
                                         'Team themes not required.',
      'DATA START',
      this.buildCorpus(dto),
      'DATA END',
    ].join('\n');

    const completion = await this.client.chat.completions.parse({
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: input },
      ],
      response_format: zodResponseFormat(SummaryZ, 'AccomplishmentSummaries'),
    });

    // 1) Grab the parsed payload (may be typed loosely by the SDK)
    const maybeParsed = completion.choices?.[0]?.message?.parsed;

    // 2) Re-validate with Zod to get a *strong* type (all required fields present)
    const validated = SummaryZ.parse(maybeParsed); // type: SummaryZType

    // 3) Map to your DTO type explicitly (eliminates “optional” illusions)
    const result: SummarizeResponseDto = {
      users: validated.users.map(u => ({
        badge: u.badge,
        name: u.name,
        summary_md: u.summary_md,
        highlights: u.highlights ?? undefined,
        blockers: u.blockers ?? undefined,
        next_focus: u.next_focus ?? undefined,
      })),
      team_themes: validated.team_themes ?? undefined,
    };

    return result;
  }
}
