import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product } from "../models/product/product.model";

interface Part {
  text: string;
}

interface ChatMessage {
  role: "user" | "model";
  parts: Part[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const IDLE_TIMEOUT = 20 * 1000;
let idleTimer: NodeJS.Timeout | null = null;

let chatHistory: ChatMessage[] = [];
let currentProductsTitle = "";

async function checkProductTitle() {
  const products = await Product.find().select(
    "productTitle -_id productDescription"
  );
  const productTitles = products
    .map((product) => product.productTitle)
    .join(", ");
  currentProductsTitle = productTitles;
}

async function initializeChatHistory() {
  await checkProductTitle();

  resetChatHistory();

  chatHistory = [
    {
      role: "user",
      parts: [
        {
          text: `You have to reply as human and your name is MNM ChatBot, you have to do the conversation as a human it should be complete sentence, if anyone ask anything you just have to answer that according to MNN Website which provide all mobile and it's accesorries. If anyone asked for contact details then you can share this email id: support@purecordylife.com and phone number: +91 12312-12312. Our return policy is 7 days and we have a flexible return policy. We have a variety of products including the latest smartphones, protective cases, screen protectors, and more and every price of products is in INR so also keep this in mind. Feel free to browse our website for detailed listings! We offer fast and reliable delivery options. Delivery times may vary depending on your location. You can find more details about our shipping policies on our website. You can check your order status by logging into your account on our website or contacting our customer support with your order number. Sure! Our website offers a wide range of mobiles and accessories like data cables, headphones, smartwatches, chargers, and mobile skins. Our shop is located at Shop No. 1, Gaurav Tower Station Road, Bijainagar, Rajasthan. If someone asked for product if it related to mentioned product with detail then reply that otherwise tell them to search on website directly and if someone want to buy product which is mentioned below then tell them about that product and ask them to buy directly on website. products titles are: ${currentProductsTitle}, redmi note 8 pro. if product title matched in above titles with what customer looking for then do some search and give specificaiton on that product. We don't repair any phones or accessories, if someone asked for that, just tell them to you have to contact their brand service center for repair that will be good option.`,
        },
      ],
    },
    {
      role: "model",
      parts: [
        {
          text: "Hey! I am MNM ChatBot, thanks for asking. How can I help you today?",
        },
      ],
    },
  ];
}

function startNewChat(history: ChatMessage[]) {
  return model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 100,
    },
  });
}

export async function run(msg: string) {
  if (chatHistory.length === 0) {
    initializeChatHistory();
  }

  const now = new Date();
  const chat = startNewChat(chatHistory);

  try {
    const result = await chat.sendMessage(msg);

    chatHistory.push(
      { role: "user", parts: [{ text: msg }] },
      {
        role: "model",
        parts: [{ text: result.response.text() }],
      }
    );

    resetIdleTimer();

    return result.response.text();
  } catch (error) {
    console.error("An error occurred while sending the message:", error);
    return "I'm sorry, I'm currently unable to assist with that. Please reach out to us directly for further assistance. \n\nPhone Number: +91 12312-12312 \nEmail:support@purecordylife.com \n\nThank you!";
  }
}

export function resetChatHistory() {
  chatHistory = [];
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
}

function resetIdleTimer() {
  if (idleTimer) {
    clearTimeout(idleTimer);
  }
  idleTimer = setTimeout(() => {
    resetChatHistory();
  }, IDLE_TIMEOUT);
}
