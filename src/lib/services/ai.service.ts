export interface AIMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export interface IntegrationContext {
  shopify: { enabled: boolean; data?: Record<string, unknown> };
  crm: { enabled: boolean; data?: Record<string, unknown> };
}

// Mock data for integrations
const MOCK_SHOPIFY_DATA = {
  products: [
    { id: "P001", name: "AI Pro Plan", price: 299, stock: "unlimited" },
    { id: "P002", name: "AI Starter Pack", price: 99, stock: "unlimited" },
    { id: "P003", name: "Enterprise Suite", price: 999, stock: "unlimited" },
  ],
  recentOrders: [
    { id: "ORD-1234", customer: "John Doe", total: 299, status: "fulfilled" },
    { id: "ORD-1235", customer: "Jane Smith", total: 99, status: "processing" },
  ],
};

const MOCK_CRM_DATA = {
  contacts: [
    { id: "C001", name: "Acme Corp", stage: "qualified", value: 5000 },
    { id: "C002", name: "TechStart", stage: "proposal", value: 12000 },
  ],
  pipeline: { totalValue: 87000, deals: 14, avgDealSize: 6214 },
};

function buildSystemPrompt(
  basePrompt: string,
  integrations: IntegrationContext,
  steps: string[]
): string {
  let prompt = basePrompt;

  if (integrations.shopify.enabled) {
    steps.push("Connecting to Shopify store...");
    prompt += `\n\n[SHOPIFY INTEGRATION ACTIVE]
Product Catalog: ${JSON.stringify(MOCK_SHOPIFY_DATA.products)}
Recent Orders: ${JSON.stringify(MOCK_SHOPIFY_DATA.recentOrders)}
Use this data when answering product/order questions.`;
  }

  if (integrations.crm.enabled) {
    steps.push("Fetching CRM data...");
    prompt += `\n\n[CRM INTEGRATION ACTIVE]
Pipeline Data: ${JSON.stringify(MOCK_CRM_DATA.pipeline)}
Active Contacts: ${JSON.stringify(MOCK_CRM_DATA.contacts)}
Use this data when discussing customer/sales context.`;
  }

  return prompt;
}

export async function callAI(
  userMessage: string,
  history: AIMessage[],
  systemPrompt: string,
  integrations: IntegrationContext,
  steps: string[]
): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  steps.push("Analyzing your request...");

  const fullSystemPrompt = buildSystemPrompt(systemPrompt, integrations, steps);

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    // Fallback mock response when no API key
    steps.push("Generating response...");
    return generateMockResponse(userMessage, integrations);
  }

  try {
    steps.push("Calling AI model...");

    const contents = [
      ...history,
      { role: "user" as const, parts: [{ text: userMessage }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: fullSystemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      if (response.status === 429) {
        steps.push("Rate limit reached, using fallback...");
        return generateMockResponse(userMessage, integrations);
      }
      throw new Error(`Gemini API error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Empty response from Gemini");

    steps.push("Response ready");
    return text;
  } catch (error) {
    console.error("AI call failed:", error);
    steps.push("Using fallback response...");
    return generateMockResponse(userMessage, integrations);
  }
}

function generateMockResponse(
  message: string,
  integrations: IntegrationContext
): string {
  const msg = message.toLowerCase();
  let response = "";

  if (msg.includes("price") || msg.includes("plan") || msg.includes("cost")) {
    if (integrations.shopify.enabled) {
      response = `Based on our Shopify catalog, here are our current plans:\n\n• **AI Starter Pack** — $99/mo — Perfect for small teams\n• **AI Pro Plan** — $299/mo — Advanced features for growing businesses\n• **Enterprise Suite** — $999/mo — Full customization and priority support\n\nWould you like more details on any of these?`;
    } else {
      response = `We offer flexible pricing plans starting at $99/month. Please contact our sales team for a customized quote based on your needs.`;
    }
  } else if (msg.includes("order") || msg.includes("purchase")) {
    if (integrations.shopify.enabled) {
      response = `I can see your recent orders in our system:\n\n• **ORD-1234** — John Doe — $299 — ✅ Fulfilled\n• **ORD-1235** — Jane Smith — $99 — 🔄 Processing\n\nIs there a specific order you'd like to inquire about?`;
    } else {
      response = "To check order status, please provide your order ID and I'll look into it for you.";
    }
  } else if (msg.includes("customer") || msg.includes("lead") || msg.includes("deal")) {
    if (integrations.crm.enabled) {
      response = `Here's your current CRM pipeline overview:\n\n• **14 active deals** worth $87,000 total\n• Average deal size: $6,214\n• Top opportunity: TechStart ($12,000) — In proposal stage\n\nWould you like to see more details on any specific deal?`;
    } else {
      response = "CRM integration is currently disabled for this project. Enable it in the integrations settings to access customer data.";
    }
  } else if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    response = `Hello! I'm your AI Assistant powered by Debales AI. I'm here to help you with:\n\n• Product information and pricing\n• Order tracking and status\n• Customer and sales data\n• General business inquiries\n\nWhat can I help you with today?`;
  } else {
    response = `Thank you for your message. I'm here to assist you with any questions about our products, orders, or services. ${
      integrations.shopify.enabled ? "I have access to your Shopify store data. " : ""
    }${
      integrations.crm.enabled ? "I also have your CRM data available. " : ""
    }\n\nCould you provide more details about what you're looking for?`;
  }

  return response;
}
