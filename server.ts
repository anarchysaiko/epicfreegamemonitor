import { Application, Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface GameImage {
  type: string;
  url: string;
}

interface GamePromotion {
  promotionalOffers: Array<{
    startDate: string;
    endDate: string;
  }>;
}

interface GameData {
  title: string;
  description?: string;
  shortDescription?: string;
  promotions: {
    promotionalOffers: Array<{
      promotionalOffers: Array<{
        startDate: string;
        endDate: string;
        discountSetting: {
          discountType: string;
          discountPercentage: number;
        };
      }>;
    }>;
    upcomingPromotionalOffers: Array<any>;
  };
  keyImages?: GameImage[];
  catalogNs?: {
    mappings: Array<{
      pageSlug: string;
    }>;
  };
  productSlug?: string;
  urlSlug?: string;
  offerMappings?: Array<{
    pageSlug: string;
  }>;
  price?: {
    totalPrice: {
      originalPrice: number;
      discountPrice: number;
      voucherDiscount: number;
      discount: number;
      currencyCode: string;
      currencyInfo: {
        decimals: number;
      };
      fmtPrice: {
        originalPrice: string;
        discountPrice: string;
        intermediatePrice: string;
      };
    };
  };
  seller?: {
    name: string;
  };
  developer?: string;
  offerType?: string;
  categories?: Array<{
    path: string;
  }>;
}

const app = new Application();
const router = new Router();

// 处理静态文件
router.get("/", async (ctx) => {
  try {
    const html = await Deno.readTextFile(join(Deno.cwd(), "index.html"));
    ctx.response.type = "text/html";
    ctx.response.body = html;
  } catch (error) {
    console.error("Error reading index.html:", error);
    ctx.response.status = 500;
    ctx.response.body = "Error loading page";
  }
});

// API 路由处理
router.get("/api/freeGames", async (ctx) => {
  try {
    console.log("开始获取游戏信息...");
    const response = await fetch("https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=zh-CN&country=CN&allowCountries=CN", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "zh-CN,zh;q=0.9",
      }
    });

    if (!response.ok) {
      throw new Error(`Epic API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log("API 响应数据结构:", JSON.stringify(data.data?.Catalog?.searchStore?.elements?.length));

    const now = new Date();

    // 解析免费游戏信息
    const freeGames = (data.data?.Catalog?.searchStore?.elements as GameData[] || [])
      .filter(game => {
        if (!game) {
          console.log("发现无效的游戏数据");
          return false;
        }

        console.log(`检查游戏 ${game.title} 的促销信息...`);

        // 检查价格是否为免费
        const intermediatePrice = game.price?.totalPrice?.fmtPrice?.intermediatePrice;
        if (intermediatePrice !== "0" && intermediatePrice !== "¥0" && intermediatePrice !== "¥0.00") {
          console.log(`${game.title} 不是免费游戏，价格为 ${intermediatePrice}`);
          return false;
        }

        // 检查是否有促销信息
        if (!game.promotions) {
          console.log(`${game.title} 没有促销信息`);
          return false;
        }

        // 检查即将推出的促销
        const upcomingPromotions = game.promotions.upcomingPromotionalOffers;
        if (upcomingPromotions?.length > 0) {
          console.log(`${game.title} 是即将免费的游戏`);
          return false;
        }

        // 检查当前促销
        const currentPromotions = game.promotions.promotionalOffers;
        if (!currentPromotions?.length) {
          console.log(`${game.title} 没有当前促销`);
          return false;
        }

        const promotionalOffers = currentPromotions[0].promotionalOffers;
        if (!promotionalOffers?.length) {
          console.log(`${game.title} 没有促销详情`);
          return false;
        }

        const promotion = promotionalOffers[0];
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);
        const now = new Date();

        // 检查促销是否有效
        const isValidPeriod = now >= startDate && now < endDate;

        console.log(`${game.title} 促销时间: ${startDate.toLocaleString('zh-CN')} - ${endDate.toLocaleString('zh-CN')}`);
        console.log(`当前时间: ${now.toLocaleString('zh-CN')}, 是否有效: ${isValidPeriod}`);

        return isValidPeriod;
      })
      .map(game => {
        const promotion = game.promotions.promotionalOffers[0].promotionalOffers[0];
        console.log(`处理游戏 ${game.title} 的详细信息...`);

        // 获取合适的游戏图片
        const getGameImage = (game: GameData): string => {
          // 按优先级尝试不同类型的图片
          const imageTypes = ['DieselStoreFrontWide', 'OfferImageWide', 'Thumbnail'];
          for (const type of imageTypes) {
            const image = game.keyImages?.find(img => img.type === type);
            if (image) return image.url;
          }
          return game.keyImages?.[0]?.url || "";
        };

        // 构建游戏URL
        const getGameUrl = (game: GameData): string => {
          const baseUrl = "https://store.epicgames.com/zh-CN";
          const slug = game.catalogNs?.mappings?.[0]?.pageSlug ||
            game.productSlug ||
            game.urlSlug ||
            game.offerMappings?.[0]?.pageSlug;

          console.log(`${game.title} 的 URL slug: ${slug}`);
          return slug ? `${baseUrl}/p/${slug}` : `${baseUrl}/free-games`;
        };

        const gameInfo = {
          title: game.title || "未知游戏",
          description: game.description || game.shortDescription || "暂无描述",
          startDate: promotion.startDate,
          endDate: promotion.endDate,
          thumbnailUrl: getGameImage(game),
          gameUrl: getGameUrl(game),
          originalPrice: game.price?.totalPrice?.originalPrice || 0,
          publisher: game.seller?.name || "未知发行商"
        };

        console.log(`游戏 ${game.title} 的信息处理完成`);
        return gameInfo;
      });

    console.log(`找到 ${freeGames.length} 个免费游戏`);

    if (freeGames.length === 0) {
      console.log("没有找到任何免费游戏，检查原始数据:", JSON.stringify(data.data?.Catalog?.searchStore?.elements?.slice(0, 2)));
    }

    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.type = "application/json";
    ctx.response.body = { games: freeGames };

  } catch (error) {
    console.error("获取免费游戏时出错:", error);
    ctx.response.status = 500;
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.type = "application/json";
    ctx.response.body = {
      error: "无法获取免费游戏信息",
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

// 使用路由中间件
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const port = parseInt(Deno.env.get("PORT") || "8080");
console.log(`服务器运行在 http://localhost:${port}`);
await app.listen({ port: port });