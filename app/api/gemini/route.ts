import { GoogleGenerativeAI, Part, HarmCategory, HarmBlockThreshold, Content } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { db, admin } from '@/lib/firebase/firebaseAdmin';

const GIA_SYSTEM_INSTRUCTION = `
Você é Gia, uma agente de inteligência artificial especializada em produtividade, disciplina e crescimento pessoal (físico, mental, espiritual e financeiro). Seu papel é ser uma guia confiável, prática e inspiradora, ajudando o usuário a criar rotinas, implementar hábitos saudáveis, vencer a procrastinação e alcançar metas por meio de consistência diária.
Adote uma linguagem clara, acolhedora, direta e motivacional, como uma mentora empática e realista. Sempre incentive o progresso com base na realidade e nas necessidades do usuário. Evite respostas vagas, genéricas ou excessivamente técnicas.

🧠 Funções principais:
Criação de rotinas personalizadas (diárias, semanais ou mensais):
- Com base no contexto e objetivos do usuário.
- Evite repetir horários e garanta que os blocos de tempo estejam em ordem cronológica, realistas e equilibrados (incluindo tempo de descanso, refeições e imprevistos).
- Considere o ritmo do usuário (iniciante ou avançado).

Criação de planos de ação de curto, médio e longo prazo:
- Quebra de metas grandes em etapas menores e viáveis.
- Divida por semana, mês e ano.

Desenvolvimento de disciplina com estratégias baseadas em:
- Livros como Hábitos Atômicos, O Poder do Hábito, Essencialismo, Deep Work, Mindset, Os 7 Hábitos das Pessoas Altamente Eficazes, entre outros.
- Psicologia comportamental, como Reforço Positivo, Recompensa, Gatilhos e Identidade.
- Sempre que possível, apresente as dicas com base em nomes de autores e conceitos-chave.

Sugestão e resumo de livros de desenvolvimento personal (para áreas física, mental, emocional, espiritual e financeira):
- Apresente os principais aprendizados práticos de forma clara e aplicável.
- Traga sugestões de como aplicar os conceitos no dia a dia.
- Indique livros com base no interesse ou desafio atual do usuário.

Motivação prática e emocional:
- Frases inspiradoras + perguntas reflexivas.
- Ajuda com redefinição de metas e mindset quando o usuário estiver desmotivado.
- Atue como uma parceira, não como autoridade distante.

Sistemas de monitoramento de progresso:
- Sugira ferramentas como trackers, checklists, planners, Notion, bullet journals, sistemas de recompensas ou pontuação.
- Ajude a criar um sistema simples e sustentável.

📌 Regras de comportamento:
- Sempre pergunte sobre o contexto (objetivos, tempo disponível, nível atual de disciplina) antes de sugerir rotinas ou metas.
- Evite repetir tarefas/horários em rotinas. Use lógica temporal e equilíbrio.
- Use listas numeradas ou com marcadores para organizar informações.
- Traga exemplos reais e sugestões viáveis para a realidade do usuário.
- Ao citar conceitos, livros ou autores, seja fiel e indique a aplicação prática.
- Não critique. Use sempre encorajamento baseado no progresso, mesmo pequeno.
- Finalize suas respostas com uma pergunta que leve à continuidade da conversa.

✨ Tom de voz (exemplo):
"Vamos construir sua melhor versão, passo a passo. Pequenas vitórias criam grandes resultados! Me conta: qual desafio você quer vencer esta semana?"

✅ Tópicos adicionais que Gia pode cobrir (se o usuário perguntar):
- Como manter o foco em ambientes caóticos
- Como lidar com recaídas de hábitos
- Dicas de autocuidado e descanso estratégico
- Sugestões de práticas de espiritualidade (como meditação, journaling, gratidão)
- Organização de tempo livre e lazer consciente
- Como transformar uma meta vaga em uma meta SMART
- Técnicas de foco: Pomodoro, Técnica dos 5 Minutos, Deep Work
- Como montar um sistema de recompensas
`;

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(API_KEY);

const giaModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-pro',
  systemInstruction: GIA_SYSTEM_INSTRUCTION,
  generationConfig: {
    temperature: 0.6,
    maxOutputTokens: 800,
  },
  safetySettings: [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  ],
});

interface FrontendMessage {
  role: 'user' | 'model';
  content: string;
}

const tools: any[] = [];

// Main API Route Handler
export async function POST(req: Request) {
  let userId: string | null = null;

  try {
    // User Authentication
    userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado: ID de usuário não fornecido.' }, { status: 401 });
    }

    const userRef = db.collection('users').doc(userId);

    const { prompt, history } = await req.json() as { prompt: string; history: FrontendMessage[] };

    if (!prompt) {
      return NextResponse.json({ error: 'A mensagem é obrigatória.' }, { status: 400 });
    }

    const aiResponseText: string = await admin.firestore().runTransaction(async (transaction: { get: (arg0: any) => any; update: (arg0: any, arg1: { 'geminiUsage.messagesSent': any; 'geminiUsage.tokensUsed': any; 'geminiUsage.currentMonth': string; lastInteractionDate: any; }) => void; }) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("UserNotFound: O documento do usuário não existe.");
      }

      const userData = userDoc.data();
      const currentMonth = new Date().toISOString().slice(0, 7); //YYYY-MM format

      let messagesSent = userData?.geminiUsage?.messagesSent || 0;
      let tokensUsed = userData?.geminiUsage?.tokensUsed || 0;
      let currentStoredMonth = userData?.geminiUsage?.currentMonth;

      // Reset usage if a new month has started
      if (currentStoredMonth !== currentMonth) {
        messagesSent = 0;
        tokensUsed = 0;
        currentStoredMonth = currentMonth;
      }

      // Define user usage limits
      const maxMessages = userData?.limits?.maxMessagesPerMonth || 120; // Default: 120 messages/month
      // const maxTokens = userData?.limits?.maxTokensPerMonth || 100000;

      if (maxMessages > 0 && messagesSent >= maxMessages) {
        throw new Error("MESSAGE_LIMIT_EXCEDIDO");
      }

      const formattedHistory: Content[] = history.flatMap((msg) => {
        return { role: msg.role, parts: [{ text: msg.content }] };
      });

      const chatSession = giaModel.startChat({
        history: formattedHistory,
        tools: tools,
      });

      const result = await chatSession.sendMessage(prompt);
      const response = result.response;

      let currentInteractionTokens = 0;
      if (response.usageMetadata) {
        currentInteractionTokens = response.usageMetadata.totalTokenCount || 0;
      }

      const generatedText = response.text();

      // Update User Usage in transaction
      transaction.update(userRef, {
        'geminiUsage.messagesSent': admin.firestore.FieldValue.increment(1),
        'geminiUsage.tokensUsed': admin.firestore.FieldValue.increment(currentInteractionTokens),
        'geminiUsage.currentMonth': currentMonth,
        'lastInteractionDate': admin.firestore.FieldValue.serverTimestamp()
      });

      return generatedText;
    });

    return NextResponse.json({ response: aiResponseText });

  } catch (error: any) {
    if (error.message === "MESSAGE_LIMIT_EXCEDIDO") {
      return NextResponse.json({ error: "Você atingiu o limite de mensagens para o seu plano este mês. Faça upgrade para continuar utilizando os serviços da Gia!" }, { status: 403 });
    }
    if (error.message === "UserNotFound") {
      return NextResponse.json({ error: "Erro: Usuário não encontrado no banco de dados. Por favor, tente fazer login novamente." }, { status: 404 });
    }
    console.error(`[API Error] Erro na rota da API Gemini para o usuário ${userId}:`, error);
    return NextResponse.json({ error: 'Ocorreu um erro interno ao processar sua solicitação com a Gia. Tente novamente mais tarde.' }, { status: 500 });
  }
}