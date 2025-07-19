import { RequestHandler, Router } from "express";

const router = Router();

// Demo user for fallback mode
const demoUser = {
  id: "demo_user",
  email: "demo@visionai.com",
  name: "Demo User",
  credits: 50,
  plan: "free",
  joinedAt: new Date(),
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
  stats: {
    imagesGenerated: 25,
    creditsUsed: 30,
    communityLikes: 150,
    followers: 10,
  },
};

export const demoLogin: RequestHandler = (req, res) => {
  res.json({
    success: true,
    message: "Demo login successful (Database offline)",
    data: {
      user: demoUser,
      token: "demo_token_12345",
    },
    demo: true,
  });
};

export const demoRegister: RequestHandler = (req, res) => {
  const { email, name } = req.body;
  res.json({
    success: true,
    message: "Demo registration successful (Database offline)",
    data: {
      user: {
        ...demoUser,
        email: email || demoUser.email,
        name: name || demoUser.name,
      },
      token: "demo_token_12345",
    },
    demo: true,
  });
};

export const demoProfile: RequestHandler = (req, res) => {
  res.json({
    success: true,
    data: {
      user: demoUser,
    },
    demo: true,
  });
};

export const demoImages: RequestHandler = (req, res) => {
  const demoImages = Array.from({ length: 5 }, (_, i) => ({
    id: `demo_img_${i}`,
    url: `https://image.pollinations.ai/prompt/demo%20image%20${i + 1}?width=512&height=512&model=flux&enhance=true&nologo=true&seed=${i * 1000}`,
    prompt: `Demo image ${i + 1} - Beautiful AI art`,
    style: ["Artistic", "Fantasy", "Sci-Fi", "Abstract", "Vintage"][i],
    dimensions: { width: 512, height: 512 },
    timestamp: new Date(Date.now() - i * 3600000),
    isSharedToCommunity: i % 2 === 0,
  }));

  res.json({
    success: true,
    data: {
      images: demoImages,
      pagination: {
        total: 5,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    },
    demo: true,
  });
};

export const demoCommunityImages: RequestHandler = (req, res) => {
  const demoImages = Array.from({ length: 8 }, (_, i) => ({
    id: `community_${i}`,
    url: `https://image.pollinations.ai/prompt/community%20art%20${i + 1}?width=512&height=512&model=flux&enhance=true&nologo=true&seed=${i * 2000}`,
    prompt: `Community showcase ${i + 1}`,
    timestamp: new Date(Date.now() - i * 7200000),
    style: [
      "Photorealistic",
      "Fantasy",
      "Cyberpunk",
      "Abstract",
      "Anime",
      "Cartoon",
      "Vintage",
      "Minimalist",
    ][i],
    dimensions: { width: 512, height: 512 },
    creator: {
      id: `creator_${i}`,
      name: `Creator ${i + 1}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=creator${i}`,
    },
    stats: {
      likes: Math.floor(Math.random() * 200) + 50,
      views: Math.floor(Math.random() * 1000) + 100,
      comments: Math.floor(Math.random() * 30) + 5,
      downloads: Math.floor(Math.random() * 50) + 10,
    },
    tags: [`tag${i}`, "demo", "art"],
  }));

  res.json({
    success: true,
    data: {
      images: demoImages,
      pagination: {
        total: 8,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
    },
    demo: true,
  });
};

export const demoGenerate: RequestHandler = async (req, res) => {
  const { prompt, style, width = 1024, height = 1024 } = req.body;

  // Simulate generation delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const imageId = `demo_gen_${Date.now()}`;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&enhance=true&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

  res.json({
    success: true,
    data: {
      id: imageId,
      url: imageUrl,
      prompt,
      style: style || "Artistic",
      dimensions: { width, height },
      timestamp: new Date(),
      isSharedToCommunity: false,
    },
    message: "Demo image generated successfully (Database offline)",
    demo: true,
  });
};

// Route definitions
router.post("/login", demoLogin);
router.post("/register", demoRegister);
router.get("/profile", demoProfile);
router.get("/images", demoImages);
router.get("/community-images", demoCommunityImages);
router.post("/generate", demoGenerate);

export default router;
