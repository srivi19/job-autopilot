import { useEffect } from "react";

const AiriaChatbot = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://embed-api.airia.ai/get-chat-embed.js";
    script.onload = () => {
      if (window.AiriaChat) {
        window.AiriaChat.init({
          pipelineId: "a2f3d859-8aee-4868-95ee-bd1edc5773b6",
          apiKey: process.env.NEXT_PUBLIC_AIRIA_API_KEY,
          apiUrl: "https://embed-api.airia.ai",
          greeting: "Hello! How can I assist you today?",
          imagePath: "https://yoursite.com/assets/chatbot-icon.png",
          imageSize: "small",
          imageBgColor: "#FFFFFF",
          autoOpen: true,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="root"></div>;
};

export default AiriaChatbot;