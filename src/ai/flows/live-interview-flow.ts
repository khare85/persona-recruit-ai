
'use server';
/**
 * @fileOverview AI-powered live conversational interviewer.
 * - conductConversationTurn: Takes conversation history and context, returns AI's next response.
 * - LiveInterviewInput: Input for the conversation turn.
 * - LiveInterviewOutput: Output from the conversation turn.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationTurnSchema = z.object({
  speaker: z.enum(['user', 'ai']),
  text: z.string(),
});

const LiveInterviewInputSchema = z.object({
  jobTitle: z.string().describe("The job title the candidate is interviewing for."),
  jobDescription: z.string().describe("The detailed job description."),
  candidateName: z.string().describe("The candidate's name."),
  candidateResumeSummary: z.string().optional().describe("A summary of the candidate's resume or profile. Can be brief."),
  conversationHistory: z.array(ConversationTurnSchema).describe("The history of the conversation so far."),
  maxTurns: z.number().optional().default(10).describe("Maximum number of conversational turns (AI response + User response = 1 turn usually implies 2 history entries). The interview should naturally conclude before or at this point.")
});
export type LiveInterviewInput = z.infer<typeof LiveInterviewInputSchema>;

const LiveInterviewOutputSchema = z.object({
  aiResponse: z.string().describe("The AI interviewer's response or next question."),
  isInterviewOver: z.boolean().describe("True if the AI has decided to conclude the interview."),
  reasonForEnding: z.string().optional().describe("If the interview is over, a brief reason or concluding remark."),
});
export type LiveInterviewOutput = z.infer<typeof LiveInterviewOutputSchema>;

export async function conductConversationTurn(input: LiveInterviewInput): Promise<LiveInterviewOutput> {
  return liveInterviewFlow(input);
}

const interviewPrompt = ai.definePrompt({
  name: 'liveInterviewPrompt',
  input: { schema: LiveInterviewInputSchema },
  output: { schema: LiveInterviewOutputSchema },
  prompt: `You are an expert AI interviewer named 'Alex' conducting a live, conversational interview.
Your goal is to assess the candidate's suitability for the role of "{{jobTitle}}".
The candidate's name is {{candidateName}}.

Job Description Snippet (for context):
---
{{jobDescription}}
---

{{#if candidateResumeSummary}}
Candidate Resume Summary (for context):
---
{{candidateResumeSummary}}
---
{{/if}}

Conversation History (last few turns):
---
{{#each conversationHistory}}
{{speaker}}: {{text}}
{{/each}}
---

INSTRUCTIONS:
1.  **Be Conversational and Engaging**: Maintain a natural, friendly, and professional tone. Your responses should be concise and direct, suitable for being spoken.
2.  **Ask Relevant Questions**: Based on the job title, description, candidate summary (if provided), and the flow of conversation, ask insightful questions. These can be behavioral, situational, or introductory.
3.  **Listen and Adapt**: Your questions and responses should logically follow what the candidate says. Acknowledge their previous response briefly if appropriate.
4.  **Guide the Interview**: Ensure the interview covers key areas. You can gently steer the conversation if needed.
5.  **Question Variety**: Mix question types.
6.  **Opening**: If the conversation history is empty, start with a greeting, introduce yourself (Alex, the AI interviewer), mention the role, and ask an opening question. For example: "Hi {{candidateName}}, I'm Alex, your AI interviewer for the {{jobTitle}} position. Thanks for making the time today. To start, could you tell me a bit about what sparked your interest in this role?"
7.  **Concluding the Interview**:
    *   The interview should naturally conclude. Aim to conclude within {{maxTurns}} total entries in conversation history (e.g. 5 AI questions + 5 User answers).
    *   If the candidate's last response seems like a good point to wrap up, or if you've asked enough questions, set "isInterviewOver" to true.
    *   Provide a polite "reasonForEnding" like "Thank you, {{candidateName}}, that's all the questions I have for now. The recruitment team will be in touch with the next steps." or "Thanks, this has been very insightful. We appreciate you sharing your experiences."
    *   Do NOT say "isInterviewOver: true" or "reasonForEnding: ..." in your actual "aiResponse" text. Only set the boolean flag and the optional reasonForEnding field in the structured output.
8.  **Your Response ("aiResponse")**: This should ONLY be what you, Alex, would say out loud. Keep it to 1-3 sentences typically.

Based on the current state, generate your "aiResponse".
If you decide to end the interview, set "isInterviewOver" to true and provide a "reasonForEnding". Otherwise, "isInterviewOver" should be false.
`,
});

const liveInterviewFlow = ai.defineFlow(
  {
    name: 'liveInterviewFlow',
    inputSchema: LiveInterviewInputSchema,
    outputSchema: LiveInterviewOutputSchema,
  },
  async (input): Promise<LiveInterviewOutput> => {
    const historyLimit = (input.maxTurns || 10) * 2;
    const recentHistory = input.conversationHistory.slice(-Math.min(input.conversationHistory.length, historyLimit - 2));

    const {output} = await interviewPrompt({
      ...input,
      conversationHistory: recentHistory,
    });

    if (!output) {
        console.error(`[liveInterviewFlow] - Prompt did not return an output for input:`, {...input, conversationHistory: `Length: ${recentHistory.length}` });
        // Fallback in case the LLM fails to produce structured output
        // This is a critical conversational flow, so providing a graceful fallback is important.
        return {
            aiResponse: "I seem to be having a little trouble forming a response right now. Could you please repeat your last statement or ask a question?",
            isInterviewOver: false,
        };
    }
    return output;
  }
);

    