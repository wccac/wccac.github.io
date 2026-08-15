import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { BottomSheet, Carousel, MobileScroll } from "./mobile";

type ProductId = "15" | "30" | "45";
type ProductArchiveCategory = "all" | "time" | "gift" | "travel" | "object" | "archive" | "timer";
type ProductArchiveId =
  | "time-15"
  | "time-30"
  | "time-45"
  | "gift-30"
  | "travel-15"
  | "wood-archive"
  | "moon-90"
  | "dial-objects"
  | "dial-timer";
type SheetMode = "product" | "tray" | "timer" | "archive" | "portfolio" | null;

type ProductArchiveItem = {
  id: ProductArchiveId;
  number: string;
  category: Exclude<ProductArchiveCategory, "all">;
  name: string;
  english: string;
  time: string;
  role: string;
  positioning: string;
  function: string;
  value: string;
  sellingPoints: string[];
  designLogic: string;
  scenes: string[];
  boundary: string;
  image: string;
  linkedTime?: ProductId;
};

const PRODUCTS: Record<
  ProductId,
  {
    minutes: number;
    name: string;
    english: string;
    specimen: string;
    color: string;
    use: string;
    note: string;
    scent: string;
    space: string;
    ritual: string;
    batch: string;
    validation: string;
    image: string;
  }
> = {
  "15": {
    minutes: 15,
    name: "晨白",
    english: "MORNING IVORY",
    specimen: "TIME SPECIMEN 01",
    color: "#E7E0D4",
    use: "晨间开始",
    note: "清透、短暂、利落。适合更衣、沏茶与开始工作前的一刻。",
    scent: "清透木质 · 轻柔微甜",
    space: "晨间书桌 / 玄关",
    ritual: "留一道窗隙，燃一支香。在水沸之前，让注意力缓慢回到眼前。",
    batch: "PILOT 00",
    validation: "目标值 · 待三批实测",
    image: "/assets/tangui/open-15.png",
  },
  "30": {
    minutes: 30,
    name: "晷墨",
    english: "SUNDIAL INK",
    specimen: "TIME SPECIMEN 02",
    color: "#151713",
    use: "静读时段",
    note: "温润木香缓慢展开，留出一段不被打断的阅读与独处时间。",
    scent: "温润檀木 · 安静回甘",
    space: "书房 / 茶席",
    ritual: "整理桌面，翻开要读的一页。香气开始稳定时，进入一段完整的静读。",
    batch: "PILOT 00",
    validation: "目标值 · 待三批实测",
    image: "/assets/tangui/open-30.png",
  },
  "45": {
    minutes: 45,
    name: "檀褐",
    english: "SANDALWOOD UMBER",
    specimen: "TIME SPECIMEN 03",
    color: "#4A3428",
    use: "沉浸香事",
    note: "深沉而绵长。适合晚间书房、会客或一席完整的东方香事。",
    scent: "深沉木质 · 余韵绵长",
    space: "晚间书房 / 会客空间",
    ritual: "调暗环境光，让燃香成为空间里唯一的时间刻度，完成一席从容的香事。",
    batch: "PILOT 00",
    validation: "目标值 · 待三批实测",
    image: "/assets/tangui/open-45.png",
  },
};

const PRODUCT_ORDER: ProductId[] = ["15", "30", "45"];
const PRODUCT_ARCHIVE_CATEGORIES: Array<{ id: ProductArchiveCategory; label: string; english: string }> = [
  { id: "all", label: "全部", english: "ALL" },
  { id: "time", label: "时间香", english: "TIME" },
  { id: "gift", label: "礼盒", english: "GIFT" },
  { id: "travel", label: "随行", english: "TRAVEL" },
  { id: "object", label: "香器", english: "OBJECT" },
  { id: "archive", label: "档案", english: "ARCHIVE" },
  { id: "timer", label: "计时器", english: "TIMER" },
];
const PRODUCT_ARCHIVE: ProductArchiveItem[] = [
  {
    id: "time-15",
    number: "01",
    category: "time",
    name: "晨白 · 15 MIN",
    english: "TIME DIAL · MORNING IVORY",
    time: "目标时长 15 MIN",
    role: "入门日用款",
    positioning: "以低时间门槛建立第一次使用体验，是檀晷最轻、最容易进入日常的一支香。",
    function: "以一支细长线香对应一段短时仪式，服务起床、更衣、沏茶与开始工作前的转换时刻。",
    value: "不要求用户预留完整半小时，先用十五分钟理解“以香为尺”的品牌方法。",
    sellingPoints: ["短时、低负担的入门选择", "晨白包装在系列中承担轻量识别", "与 30 / 45 MIN 形成明确时间梯度"],
    designLogic: "暖灰象牙纸面代表日光初现，右侧压凹木纹既是触觉记忆，也是沿日影分割线开启包装的结构提示。",
    scenes: ["晨间书桌", "玄关整理", "一杯茶的准备时间"],
    boundary: "15 MIN 为概念目标值；需以香径、配方、湿度和三批样品燃烧测试确定最终规格。",
    image: "/assets/tangui/archive-01-15.png",
    linkedTime: "15",
  },
  {
    id: "time-30",
    number: "02",
    category: "time",
    name: "晷墨 · 30 MIN",
    english: "TIME DIAL · SUNDIAL INK",
    time: "目标时长 30 MIN",
    role: "品牌核心款",
    positioning: "位于三档时间的中轴，承担主销、视觉识别与品牌方法说明，是整个日晷系列的英雄单品。",
    function: "对应一次完整阅读、静坐或专注工作的中等时段，让线香长度与日常节奏建立稳定联系。",
    value: "在使用频率、仪式完整度与空间适配之间取得平衡，最适合成为消费者理解品牌的第一件标准产品。",
    sellingPoints: ["三档时间系统的中心锚点", "晷墨黑形成最强货架识别", "可与礼盒、计时器和数字计时联动"],
    designLogic: "墨黑正面压低视觉噪声，木纹右板与日影折线共同构成开合方向；白色标志和大号 30 形成远距识别。",
    scenes: ["静读半小时", "茶席独处", "工作段落切换"],
    boundary: "香气描述和 30 MIN 时长均为设计假设，需在配方、燃烧稳定性与室内安全测试完成后定稿。",
    image: "/assets/tangui/archive-02-30.png",
    linkedTime: "30",
  },
  {
    id: "time-45",
    number: "03",
    category: "time",
    name: "檀褐 · 45 MIN",
    english: "TIME DIAL · SANDALWOOD UMBER",
    time: "目标时长 45 MIN",
    role: "长时沉浸款",
    positioning: "面向已有燃香习惯和更完整的空间仪式，承担系列中更深、更慢的体验层级。",
    function: "提供较长的连续燃香时段，用于晚间阅读、会客或一席不被打断的香事。",
    value: "把檀晷从“短时提醒”扩展到“空间陪伴”，提高系列的体验深度和收藏完整性。",
    sellingPoints: ["长时段覆盖晚间与会客场景", "檀褐色直接连接木质原料联想", "与 15 / 30 MIN 形成递进式收藏逻辑"],
    designLogic: "深褐纸面与右侧木纹压凹接近同色异质，通过触觉而非装饰色制造高级感；大号 45 保持时间识别优先。",
    scenes: ["晚间书房", "小型会客", "完整茶席"],
    boundary: "长时燃烧对香灰承接、倾倒稳定性与通风提示要求更高，必须与配套香托共同完成安全验证。",
    image: "/assets/tangui/archive-03-45.png",
    linkedTime: "45",
  },
  {
    id: "gift-30",
    number: "04",
    category: "gift",
    name: "日晷礼盒 · 30 MIN",
    english: "SIGNATURE TIME DIAL",
    time: "核心礼赠套装",
    role: "品牌仪式入口",
    positioning: "以 30 MIN 核心香为中心，集合线香与条形香托，承担首购升级、礼赠和品牌陈列。",
    function: "在一个盒体中明确区分香与香托的位置，让用户开盒后即可完成从取香、安置到计时的完整流程。",
    value: "它不是放大版单盒，而是品牌方法的实体演示：左侧保存时间，右侧木纹结构负责开启仪式。",
    sellingPoints: ["香与托盘一盒成套，无需另配器物", "右侧木纹板作为抽拉开启端", "30 MIN 英雄产品强化礼赠识别"],
    designLogic: "右上角切角对应日晷投影，日影折线成为真实开合线；木纹板向右抽离后露出细长线香和条形矿物香托。",
    scenes: ["正式礼赠", "品牌首购", "书房陈列"],
    boundary: "最终量产必须校核盒体闭合公差、抽拉阻尼、香支实际长度、内托防震与香托耐热材质。",
    image: "/assets/tangui/archive-04-gift.png",
    linkedTime: "30",
  },
  {
    id: "travel-15",
    number: "05",
    category: "travel",
    name: "随行晷 · 15 MIN",
    english: "TRAVEL DIAL",
    time: "便携短时香",
    role: "场景扩展款",
    positioning: "把 15 MIN 的短时体验带出书房，面向出差、办公与临时停留空间。",
    function: "以窄长容器收纳短规格线香；多边截面降低滚动，木质上盖承担开合和系列识别。",
    value: "不是缩小礼盒，而是将“随时留出十五分钟”转译成更耐携带、占用更小的产品形态。",
    sellingPoints: ["多边筒身防滚动、便于竖放", "15 MIN 与移动场景匹配", "木质端盖延续系列触感"],
    designLogic: "纵向比例呼应线香本体，象牙白主体减轻体量感，深色木盖与底座像日晷上下刻度，为便携形态提供稳定视觉重心。",
    scenes: ["差旅酒店", "独立办公室", "短时休息"],
    boundary: "便携容器需验证密封、防折断、防潮与余香残留；外出使用仍须遵守场地明火规定。",
    image: "/assets/tangui/archive-05-travel.png",
    linkedTime: "15",
  },
  {
    id: "wood-archive",
    number: "06",
    category: "archive",
    name: "木质档案册",
    english: "WOOD ARCHIVE",
    time: "原料与批次信息",
    role: "品牌证据载体",
    positioning: "不直接承担燃香消费，而是记录香材来源、气味档案、批次与测试信息，补足高端品牌最容易缺失的可信度。",
    function: "以册页结构收纳原料卡、批次卡、香型说明和后续检测文件，形成可阅读、可更新的材料档案。",
    value: "把木纹从装饰升级为内容来源，让消费者知道品牌为什么使用这些材料、哪些信息已经验证、哪些仍在开发。",
    sellingPoints: ["建立原料与批次的可追溯叙事", "册页形态适合收藏与持续补充", "连接品牌教育、陈列与售后信息"],
    designLogic: "书脊使用深色纵向木纹，纸面保持象牙白；日影折线像档案封缄，视觉上与 APP 左侧固定木条形成线上线下一致。",
    scenes: ["礼盒随附", "品牌展陈", "会员档案收藏"],
    boundary: "来源、产区、年份、配比与检测结论只能在获得供应链文件和检测报告后填写，不以故事替代证据。",
    image: "/assets/tangui/archive-06-wood.png",
  },
  {
    id: "moon-90",
    number: "07",
    category: "object",
    name: "月晷盘香 · 90 MIN",
    english: "MOON DIAL",
    time: "目标时长 90 MIN",
    role: "长时空间产品",
    positioning: "从直线香扩展到盘香，以月晷意象承接更长的空间陪伴，形成日晷系列之外的柔和长时分支。",
    function: "圆形低盒收纳完整盘香，并配套圆形承灰香托；适合需要稳定摆放与较长燃烧路径的使用方式。",
    value: "将品牌的时间语言从直线延伸到圆周，既丰富产品轮廓，也为客厅和长时阅读建立独立产品理由。",
    sellingPoints: ["盘香与圆形香托成套", "圆周刻度直接表达时间循环", "低矮盒型扩充品牌陈列层次"],
    designLogic: "深色木纹盒盖压入一圈日晷刻度，圆形香托延续同一中心轴；盒体和器物不是两个造型，而是同一套时间图形的内外对应。",
    scenes: ["客厅阅读", "长时茶叙", "安静工作室"],
    boundary: "90 MIN 为概念目标值；盘香配方、断裂率、燃烧连续性、底部隔热和承灰范围需要独立打样验证。",
    image: "/assets/tangui/archive-07-moon.png",
  },
  {
    id: "dial-objects",
    number: "08",
    category: "object",
    name: "晷器套装",
    english: "DIAL OBJECTS",
    time: "可持续使用器物",
    role: "耐用品体系",
    positioning: "把香托从礼盒配件提升为可以独立收藏和长期使用的器物线，承担复购之外的品牌价值。",
    function: "围绕不同香形配置条形托、圆形盘香托与安全熄香小件，统一承灰、隔热和稳定摆放的功能。",
    value: "耗材之外建立耐用品资产，让品牌不只销售香，也提供完整、可维护的使用秩序。",
    sellingPoints: ["适配线香与盘香两种形态", "矿物灰低光泽弱化灰尘视觉", "器物与包装共享日晷中心孔和木纹分割"],
    designLogic: "方盒内部以圆形开窗露出器物，形成方与圆、纸与矿物的对照；右侧浅木纹板继续承担开合和触觉识别。",
    scenes: ["日常替换器物", "礼盒升级", "书桌长期陈列"],
    boundary: "材质需验证耐热、阻燃、倾倒稳定、清洁方式和香灰容量；在完成测试前不宣称具体材料性能。",
    image: "/assets/tangui/archive-08-objects.png",
  },
  {
    id: "dial-timer",
    number: "09",
    category: "timer",
    name: "三角机械计时器",
    english: "DIAL TIMER",
    time: "0—60 MIN",
    role: "品牌时间工具",
    positioning: "将 15 / 30 / 45 MIN 的包装信息转化成可操作的实体界面，是品牌从香品走向时间方式的关键产品。",
    function: "通过机械旋钮设定时间，黑色圆盘读取刻度，赭红扇区提示剩余时长；三角木质底座提供稳定摆放。",
    value: "用户无需打开手机即可开始一段时间，使线下器物、包装刻度与 APP 计时形成完整闭环。",
    sellingPoints: ["15 / 30 / 45 三档一眼可读", "机械旋钮带来明确触觉反馈", "三角形态与现有长方、圆形包装形成轮廓差异"],
    designLogic: "三角轮廓来自日晷指针与投影夹角，圆形表盘继承 Logo；木质外壳避免计时器看起来像通用电子产品。",
    scenes: ["点香同步计时", "阅读与专注", "桌面陈列"],
    boundary: "需要验证真实机芯精度、蜂鸣音量、旋钮寿命、木壳散热与阻燃距离；当前不等同于可量产工程图。",
    image: "/assets/tangui/archive-09-timer.png",
  },
];
const CENTER_LOOP_CYCLE = 3;
const LOOPED_PRODUCTS = Array.from({ length: 7 }, (_, cycle) =>
  PRODUCT_ORDER.map((id) => ({ id, cycle })),
).flat();
const NAV_ITEMS = ["香品", "计时", "档案"] as const;
const SESSION_STORAGE_KEY = "tangui.completed-sessions.v1";
const EMPTY_SESSION_COUNTS: Record<ProductId, number> = { "15": 0, "30": 0, "45": 0 };

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function Prototype() {
  const [selectedId, setSelectedId] = useState<ProductId>("30");
  const [activeNav, setActiveNav] = useState<(typeof NAV_ITEMS)[number]>("香品");
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [secondsLeft, setSecondsLeft] = useState(PRODUCTS["30"].minutes * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<Record<ProductId, number>>(EMPTY_SESSION_COUNTS);
  const [archiveCategory, setArchiveCategory] = useState<ProductArchiveCategory>("all");
  const [activeArchiveId, setActiveArchiveId] = useState<ProductArchiveId>("gift-30");
  const carouselNodeRef = useRef<HTMLDivElement | null>(null);
  const archiveCarouselNodeRef = useRef<HTMLDivElement | null>(null);
  const selected = PRODUCTS[selectedId];
  const filteredArchiveProducts = useMemo(
    () => PRODUCT_ARCHIVE.filter((item) => archiveCategory === "all" || item.category === archiveCategory),
    [archiveCategory],
  );
  const activeArchive =
    PRODUCT_ARCHIVE.find((item) => item.id === activeArchiveId) ?? filteredArchiveProducts[0] ?? PRODUCT_ARCHIVE[0];
  const activeArchiveIndex = Math.max(
    0,
    filteredArchiveProducts.findIndex((item) => item.id === activeArchive.id),
  );

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "檀晷 · 时间档案";
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Record<ProductId, number>>;
        setCompletedSessions({
          "15": Number(parsed["15"]) || 0,
          "30": Number(parsed["30"]) || 0,
          "45": Number(parsed["45"]) || 0,
        });
      }
    } catch {
      setCompletedSessions(EMPTY_SESSION_COUNTS);
    }
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    setSecondsLeft(PRODUCTS[selectedId].minutes * 60);
    setTimerRunning(false);
  }, [selectedId]);

  useEffect(() => {
    if (sheetMode === null) return;
    const screen = document.querySelector<HTMLElement>('[data-testid="device-screen"]');
    if (!screen) return;

    screen.scrollTop = 0;
    const resetFrame = window.requestAnimationFrame(() => {
      screen.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(resetFrame);
  }, [sheetMode]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          setCompletedSessions((previous) => {
            const next = { ...previous, [selectedId]: previous[selectedId] + 1 };
            try {
              window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
            } catch {
              // 本地存储不可用时仍允许计时正常完成。
            }
            return next;
          });
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [selectedId, timerRunning]);

  useEffect(() => {
    const node = document.querySelector<HTMLDivElement>(".tangui-product-carousel");
    if (!node) return;
    carouselNodeRef.current = node;
    let initialized = false;
    let syncFrame = 0;

    const slides = () => Array.from(node.querySelectorAll<HTMLElement>(".product-slide"));
    const centerOn = (slide: HTMLElement) => {
      node.scrollLeft = slide.offsetLeft - (node.clientWidth - slide.offsetWidth) / 2;
    };

    const initializeTimer = window.setTimeout(() => {
      const target = slides().find(
        (slide) => slide.dataset.productId === "30" && slide.dataset.loopCycle === String(CENTER_LOOP_CYCLE),
      );
      if (target) centerOn(target);
      initialized = true;
      syncSelection();
    }, 120);

    const syncSelection = () => {
      window.cancelAnimationFrame(syncFrame);
      syncFrame = window.requestAnimationFrame(() => {
        if (!initialized) return;
        const items = slides();
        if (items.length === 0) return;
        const viewportCenter = node.scrollLeft + node.clientWidth / 2;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        items.forEach((slide, index) => {
          const center = slide.offsetLeft + slide.offsetWidth / 2;
          const distance = Math.abs(center - viewportCenter);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });

        const nearest = items[nearestIndex];
        const id = nearest.dataset.productId as ProductId | undefined;
        if (id && PRODUCT_ORDER.includes(id)) {
          setSelectedId((current) => (current === id ? current : id));
          setActiveNav("香品");
        }

        const cycleWidth = items[3]?.offsetLeft - items[0]?.offsetLeft;
        if (!cycleWidth) return;
        if (nearestIndex < 6) {
          node.scrollLeft += cycleWidth * 3;
        } else if (nearestIndex > items.length - 7) {
          node.scrollLeft -= cycleWidth * 3;
        }
      });
    };

    node.addEventListener("scroll", syncSelection, { passive: true });
    return () => {
      window.clearTimeout(initializeTimer);
      window.cancelAnimationFrame(syncFrame);
      node.removeEventListener("scroll", syncSelection);
      carouselNodeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const revealNodes = Array.from(document.querySelectorAll<HTMLElement>(".reveal-section"));
    const scrollRoot = document.querySelector<HTMLElement>(".tangui-app");
    if (revealNodes.length === 0) return;
    if (!("IntersectionObserver" in window)) {
      revealNodes.forEach((node) => node.setAttribute("data-revealed", "true"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).setAttribute("data-revealed", "true");
          observer.unobserve(entry.target);
        });
      },
      { root: scrollRoot, rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    revealNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveArchiveId((current) =>
      filteredArchiveProducts.some((item) => item.id === current) ? current : filteredArchiveProducts[0].id,
    );

    const node = document.querySelector<HTMLDivElement>(".product-archive-carousel");
    if (!node) return;
    archiveCarouselNodeRef.current = node;
    let syncFrame = 0;
    const syncArchiveSelection = () => {
      window.cancelAnimationFrame(syncFrame);
      syncFrame = window.requestAnimationFrame(() => {
        const cards = Array.from(node.querySelectorAll<HTMLElement>(".product-archive-card"));
        if (cards.length === 0) return;
        const center = node.scrollLeft + node.clientWidth / 2;
        const nearest = cards.reduce((best, card) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const bestCenter = best.offsetLeft + best.offsetWidth / 2;
          return Math.abs(cardCenter - center) < Math.abs(bestCenter - center) ? card : best;
        }, cards[0]);
        const id = nearest.dataset.archiveId as ProductArchiveId | undefined;
        if (id) setActiveArchiveId((current) => (current === id ? current : id));
      });
    };

    const resetFrame = window.requestAnimationFrame(() => {
      node.scrollTo({ left: 0, behavior: "smooth" });
      syncArchiveSelection();
    });
    node.addEventListener("scroll", syncArchiveSelection, { passive: true });
    return () => {
      window.cancelAnimationFrame(resetFrame);
      window.cancelAnimationFrame(syncFrame);
      node.removeEventListener("scroll", syncArchiveSelection);
      archiveCarouselNodeRef.current = null;
    };
  }, [filteredArchiveProducts]);

  const scrollProductIntoView = useCallback((id: ProductId) => {
    const node = carouselNodeRef.current;
    if (!node) return;
    const target = Array.from(node.querySelectorAll<HTMLElement>(".product-slide")).find(
      (slide) => slide.dataset.productId === id && slide.dataset.loopCycle === String(CENTER_LOOP_CYCLE),
    );
    if (!target) return;
    node.scrollTo({
      left: target.offsetLeft - (node.clientWidth - target.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  const chooseProduct = useCallback(
    (id: ProductId, moveCarousel = true) => {
      setActiveNav("香品");
      setSelectedId(id);
      if (moveCarousel) scrollProductIntoView(id);
    },
    [scrollProductIntoView],
  );

  const stepArchive = (direction: -1 | 1) => {
    const node = archiveCarouselNodeRef.current;
    if (!node) return;
    const cards = Array.from(node.querySelectorAll<HTMLElement>(".product-archive-card"));
    if (cards.length === 0) return;
    const currentIndex = Math.max(0, cards.findIndex((card) => card.dataset.archiveId === activeArchive.id));
    const nextIndex = (currentIndex + direction + cards.length) % cards.length;
    const next = cards[nextIndex];
    const id = next.dataset.archiveId as ProductArchiveId | undefined;
    if (id) setActiveArchiveId(id);
    node.scrollTo({
      left: next.offsetLeft - (node.clientWidth - next.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  const sheetCopy = useMemo(() => {
    if (sheetMode === "tray") {
      return { title: "香托", description: "INCENSE TRAY · 矿物灰" };
    }
    if (sheetMode === "timer") {
      return { title: `${selected.minutes} 分钟计时`, description: `${selected.name} · ${selected.use}` };
    }
    if (sheetMode === "archive") {
      return { title: "证据档案", description: "EVIDENCE LEDGER · PILOT 00" };
    }
    if (sheetMode === "portfolio") {
      return { title: activeArchive.name, description: `${activeArchive.number} · ${activeArchive.english}` };
    }
    return { title: `${selected.minutes} MIN · ${selected.name}`, description: selected.specimen };
  }, [activeArchive, selected, sheetMode]);

  const sheetSnap = sheetMode === "timer" ? 0.6 : sheetMode === "archive" ? 0.76 : sheetMode === "portfolio" ? 0.86 : 0.72;

  const openTimer = () => {
    setActiveNav("计时");
    setSheetMode("timer");
  };

  return (
    <>
      <div className="archive-fixed-chrome">
        <aside className="archive-spine" aria-hidden="true">
          <span className="spine-signature">TÁN GUǏ</span>
        </aside>

        <header className="brand-header fixed-brand-header">
          <div className="brand-lockup">
            <span className="brand-name">檀晷</span>
            <img src="/assets/tangui/logo-symbol.svg" alt="檀晷日晷标志" />
          </div>
          <div className="archive-index">
            <span>ARCHIVE 02</span>
            <span>WangC</span>
          </div>
        </header>
      </div>

      <MobileScroll className="app-screen tangui-app">
        <main className="archive-page" data-testid="tangui-home" aria-label="檀晷香品档案">
          <div className="archive-canvas">
            <section className="intro-copy" aria-labelledby="archive-heading">
              <h1 id="archive-heading">选择一段<br />属于自己的时间</h1>
              <p>15 / 30 / 45 为产品目标时长；实体批次完成前，所有参数保持待验证状态。</p>
            </section>

            <section className="product-stage" aria-label="檀晷循环产品轮播">
              <Carousel
                className="tangui-product-carousel"
                contentClassName="product-carousel-track"
                ariaLabel="左右滑动查看檀晷 15、30、45 分钟香品"
              >
                {LOOPED_PRODUCTS.map(({ id, cycle }) => {
                  const item = PRODUCTS[id];
                  return (
                    <article
                      className="product-slide"
                      data-product-id={id}
                      data-loop-cycle={cycle}
                      data-selected={selectedId === id ? "true" : "false"}
                      key={`${cycle}-${id}`}
                    >
                      <button
                        className="product-slide-button"
                        aria-label={`打开 ${item.minutes} 分钟 ${item.name} 香品详情`}
                        onClick={() => {
                          chooseProduct(id, false);
                          setSheetMode("product");
                        }}
                      >
                        <img src={item.image} alt={`檀晷 ${item.minutes} MIN ${item.name} 产品包装`} />
                      </button>
                    </article>
                  );
                })}
              </Carousel>
              <span className="carousel-swipe-hint" aria-hidden="true">SWIPE · 左右滑动</span>
            </section>

            <section className="specimen-selector" aria-label="选择燃香时长">
              {PRODUCT_ORDER.map((id) => {
                const item = PRODUCTS[id];
                const active = selectedId === id;
                return (
                  <button
                    key={id}
                    className="specimen-option"
                    data-active={active ? "true" : "false"}
                    aria-pressed={active}
                    aria-label={`选择 ${item.minutes} 分钟 ${item.name}`}
                    onClick={() => chooseProduct(id)}
                  >
                    <span className="selection-rule" />
                    <strong>{item.minutes}</strong>
                    <small>{item.name}</small>
                    <i />
                  </button>
                );
              })}
            </section>

            <button
              className="view-specimen"
              onClick={() => {
                setActiveNav("香品");
                setSheetMode("product");
              }}
            >
              <span>
                <strong>查看 {selected.minutes} MIN</strong>
                <small>VIEW SPECIMEN {selected.specimen.slice(-2)}</small>
              </span>
              <span className="cta-line" aria-hidden="true" />
              <ArrowRightIcon aria-hidden="true" />
            </button>

            <button
              className="tray-entry"
              onClick={() => {
                setActiveNav("香品");
                setSheetMode("tray");
              }}
            >
              <img src="/assets/tangui/tray-cut.png" alt="檀晷矿物灰条形燃香托盘" />
              <span className="tray-divider" aria-hidden="true" />
              <span className="tray-copy">
                <strong>香托</strong>
                <small>INCENSE TRAY</small>
              </span>
              <ArrowRightIcon aria-hidden="true" />
            </button>

            <section className="brand-story reveal-section" aria-labelledby="brand-story-title">
              <span className="section-kicker">BRAND NOTE 01</span>
              <h2 id="brand-story-title">以香为尺，读一寸时间</h2>
              <p>“晷”是日影留下的刻度。檀晷把线香的燃烧长度转译成 15、30、45 分钟三种时间标本，让香气不只是气味，也是日常节奏的一部分。</p>
              <dl>
                <div><dt>日晷</dt><dd>标记时间秩序</dd></div>
                <div><dt>木纹</dt><dd>保存檀木触感</dd></div>
                <div><dt>香长</dt><dd>对应使用情境</dd></div>
              </dl>
            </section>

            <section className="product-constellation reveal-section" aria-labelledby="product-constellation-title">
              <div className="constellation-heading">
                <span className="section-kicker">PRODUCT CONSTELLATION · 01—09</span>
                <h2 id="product-constellation-title">一套完整的时间器物</h2>
                <p>从短时线香、礼盒与随行筒，到盘香、香器、材料档案和机械计时器，九项产品围绕同一套日晷刻度与木纹开合逻辑展开。</p>
              </div>

              <figure className="family-overview">
                <img
                  src="/assets/tangui/product-family-expanded.png"
                  alt="檀晷完整产品家族：15、30、45 分钟时间香、30 分钟礼盒、随行晷、木质档案册、月晷盘香、晷器套装与三角机械计时器"
                />
                <figcaption>
                  <span>MASTER PRODUCT FAMILY</span>
                  <small>概念视觉基准 · 九项产品</small>
                </figcaption>
              </figure>

              <div className="archive-filter-heading">
                <span>按品类浏览</span>
                <small>{filteredArchiveProducts.length.toString().padStart(2, "0")} ITEMS</small>
              </div>
              <Carousel
                className="archive-category-carousel"
                contentClassName="archive-category-track"
                ariaLabel="筛选檀晷产品档案"
              >
                {PRODUCT_ARCHIVE_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    className="archive-category-option"
                    data-active={archiveCategory === category.id ? "true" : "false"}
                    aria-pressed={archiveCategory === category.id}
                    onClick={() => setArchiveCategory(category.id)}
                  >
                    <span>{category.label}</span>
                    <small>{category.english}</small>
                  </button>
                ))}
              </Carousel>

              <div className="product-archive-status" aria-live="polite">
                <span>{(activeArchiveIndex + 1).toString().padStart(2, "0")}</span>
                <i aria-hidden="true" />
                <small>{filteredArchiveProducts.length.toString().padStart(2, "0")}</small>
                <b>{activeArchive.role}</b>
                <div className="archive-step-controls" aria-label="逐项切换产品">
                  <button aria-label="上一个产品" onClick={() => stepArchive(-1)}>
                    <ArrowRightIcon aria-hidden="true" />
                  </button>
                  <button aria-label="下一个产品" onClick={() => stepArchive(1)}>
                    <ArrowRightIcon aria-hidden="true" />
                  </button>
                </div>
              </div>

              <Carousel
                className="product-archive-carousel"
                contentClassName="product-archive-track"
                ariaLabel="左右滑动查看九项产品定位与分析"
                showScrollbar
              >
                {filteredArchiveProducts.map((item) => (
                  <article
                    key={item.id}
                    className="product-archive-card"
                    data-archive-id={item.id}
                    data-active={activeArchive.id === item.id ? "true" : "false"}
                  >
                    <header>
                      <span>PRODUCT {item.number}</span>
                      <small>{item.role}</small>
                    </header>
                    <button
                      className="archive-product-visual"
                      aria-label={`查看 ${item.name} 完整产品分析`}
                      onClick={() => {
                        setActiveArchiveId(item.id);
                        setSheetMode("portfolio");
                      }}
                    >
                      <img src={item.image} alt={`檀晷 ${item.name} 产品实物概念图`} />
                    </button>
                    <div className="archive-product-copy">
                      <span>{item.time}</span>
                      <h3>{item.name}</h3>
                      <small>{item.english}</small>
                      <p>{item.positioning}</p>
                      <dl>
                        <div><dt>核心价值</dt><dd>{item.value}</dd></div>
                        <div><dt>适用场景</dt><dd>{item.scenes.join(" · ")}</dd></div>
                      </dl>
                    </div>
                    <button
                      className="archive-detail-action"
                      onClick={() => {
                        setActiveArchiveId(item.id);
                        setSheetMode("portfolio");
                      }}
                    >
                      查看完整分析 <ArrowRightIcon aria-hidden="true" />
                    </button>
                  </article>
                ))}
              </Carousel>
              <p className="archive-swipe-note">左右滑动切换产品；点击图片或“查看完整分析”进入产品档案。</p>
            </section>

            <section className="evidence-preview reveal-section" aria-labelledby="evidence-preview-title">
              <span className="section-kicker">EVIDENCE LEDGER</span>
              <h2 id="evidence-preview-title">高端感，需要可以被核对</h2>
              <p>檀晷把原料、批次、燃烧时长与安全测试纳入产品设计。当前是概念验证阶段，不把目标参数写成既成事实。</p>
              <ul>
                <li><span>时长测试</span><strong>待三批实测</strong></li>
                <li><span>香材批次</span><strong>结构已预留</strong></li>
                <li><span>安全标准</span><strong>GB 26386-2025</strong></li>
              </ul>
              <button
                onClick={() => {
                  setActiveNav("档案");
                  setSheetMode("archive");
                }}
              >
                查看验证档案 <ArrowRightIcon aria-hidden="true" />
              </button>
            </section>

            <section className="time-guide reveal-section" aria-labelledby="time-guide-title">
              <span className="section-kicker">TIME GUIDE</span>
              <h2 id="time-guide-title">今天，留多久给自己？</h2>
              {PRODUCT_ORDER.map((id) => {
                const item = PRODUCTS[id];
                return (
                  <button key={id} onClick={() => chooseProduct(id)}>
                    <span><strong>{item.minutes}</strong><small>MIN</small></span>
                    <span><b>{item.name}</b><small>{item.space}</small></span>
                    <ArrowRightIcon aria-hidden="true" />
                  </button>
                );
              })}
            </section>
          </div>
        </main>
      </MobileScroll>

      <nav className="archive-nav" aria-label="檀晷应用导航">
        <span className="nav-spine-fill" aria-hidden="true" />
        <div className="nav-items">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              data-active={activeNav === item ? "true" : "false"}
              aria-current={activeNav === item ? "page" : undefined}
              onClick={() => {
                if (item === "香品") {
                  setActiveNav(item);
                  setSheetMode(null);
                  return;
                }
                setActiveNav(item);
                setSheetMode(item === "计时" ? "timer" : "archive");
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </nav>

      <BottomSheet
        open={sheetMode !== null}
        onOpenChange={(open) => {
          if (!open) setSheetMode(null);
        }}
        title={sheetCopy.title}
        description={sheetCopy.description}
        snap={sheetSnap}
      >
        {sheetMode === "product" ? (
          <section className="sheet-product sheet-safe-content" data-testid="product-detail">
            <div className="sheet-specimen-line">
              <span style={{ background: selected.color }} />
              <small>{selected.english}</small>
            </div>
            <p className="sheet-lead">{selected.note}</p>
            <dl>
              <div><dt>目标时长</dt><dd>{selected.minutes} MIN</dd></div>
              <div><dt>验证状态</dt><dd>{selected.validation}</dd></div>
              <div><dt>批次</dt><dd>{selected.batch}</dd></div>
              <div><dt>香气印象</dt><dd>{selected.scent}</dd></div>
              <div><dt>建议空间</dt><dd>{selected.space}</dd></div>
              <div><dt>使用场景</dt><dd>{selected.use}</dd></div>
              <div><dt>包装色</dt><dd>{selected.name}</dd></div>
            </dl>
            <div className="sheet-context-note">
              <span>RITUAL NOTE</span>
              <h3>这一段时间，可以这样开始</h3>
              <p>{selected.ritual}</p>
            </div>
            <button className="sheet-primary" onClick={openTimer}>开始 {selected.minutes} MIN</button>
          </section>
        ) : null}

        {sheetMode === "tray" ? (
          <section className="sheet-tray sheet-safe-content">
            <img src="/assets/tangui/tray-master.png" alt="檀晷条形燃香托盘包装与实物" />
            <p className="sheet-lead">细长凹槽承接线香与香灰，矿物灰表面与礼盒内衬形成克制的材质对照。</p>
            <dl className="tray-specs">
              <div><dt>形态</dt><dd>条形承灰槽</dd></div>
              <div><dt>适配</dt><dd>细长线香</dd></div>
              <div><dt>视觉</dt><dd>矿物灰 · 低光泽</dd></div>
            </dl>
            <div className="sheet-context-note">
              <span>OBJECT NOTE</span>
              <h3>让香灰也落在秩序之中</h3>
              <p>香托沿用包装的纵向比例，使香、托盘与盒体在开盒时形成明确的左右板块。</p>
            </div>
          </section>
        ) : null}

        {sheetMode === "timer" ? (
          <section className="sheet-timer sheet-safe-content" data-testid="incense-timer">
            <span className="timer-kicker">{selected.specimen}</span>
            <strong>{formatTime(secondsLeft)}</strong>
            <p>{timerRunning ? "一寸香，一段不被打断的时间。" : "点燃线香后，再开始计时。"}</p>
            <div className="timer-ritual">
              <span>{selected.scent}</span>
              <span>{selected.space}</span>
            </div>
            <div className="session-record" aria-live="polite">
              本机已完成 <strong>{completedSessions[selectedId]}</strong> 次 {selected.minutes} MIN 时间记录
            </div>
            <div className="timer-actions">
              <button
                className="sheet-primary"
                onClick={() => {
                  if (secondsLeft === 0) setSecondsLeft(selected.minutes * 60);
                  setTimerRunning((running) => !running);
                }}
              >
                {timerRunning ? "暂停" : secondsLeft === 0 ? "重新开始" : "开始计时"}
              </button>
              <button
                className="sheet-secondary"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(selected.minutes * 60);
                }}
              >
                归零
              </button>
            </div>
          </section>
        ) : null}

        {sheetMode === "portfolio" ? (
          <article className="sheet-portfolio sheet-safe-content" data-testid="portfolio-detail">
            <div className="portfolio-hero">
              <img src={activeArchive.image} alt={`檀晷 ${activeArchive.name} 产品实物概念图`} />
              <div>
                <span>PRODUCT {activeArchive.number}</span>
                <small>{activeArchive.role}</small>
              </div>
            </div>

            <div className="portfolio-positioning">
              <span>POSITIONING</span>
              <h3>产品定位</h3>
              <p>{activeArchive.positioning}</p>
            </div>

            <dl className="portfolio-facts">
              <div><dt>产品角色</dt><dd>{activeArchive.role}</dd></div>
              <div><dt>时间 / 类型</dt><dd>{activeArchive.time}</dd></div>
              <div><dt>核心功能</dt><dd>{activeArchive.function}</dd></div>
              <div><dt>核心价值</dt><dd>{activeArchive.value}</dd></div>
            </dl>

            <section className="portfolio-analysis-block">
              <span>SELLING POINTS</span>
              <h3>核心卖点</h3>
              <ol>
                {activeArchive.sellingPoints.map((point, index) => (
                  <li key={point}><span>{(index + 1).toString().padStart(2, "0")}</span><p>{point}</p></li>
                ))}
              </ol>
            </section>

            <section className="portfolio-analysis-block">
              <span>DESIGN LOGIC</span>
              <h3>设计逻辑</h3>
              <p>{activeArchive.designLogic}</p>
            </section>

            <section className="portfolio-analysis-block">
              <span>USE CONTEXT</span>
              <h3>使用场景</h3>
              <div className="portfolio-scenes">
                {activeArchive.scenes.map((scene) => <span key={scene}>{scene}</span>)}
              </div>
            </section>

            <section className="portfolio-validation">
              <span>DEVELOPMENT BOUNDARY</span>
              <h3>当前开发边界</h3>
              <p>{activeArchive.boundary}</p>
              <small>概念设计 · 待实体打样与检测验证</small>
            </section>

            {activeArchive.linkedTime ? (
              <button
                className="sheet-primary portfolio-timer-action"
                onClick={() => {
                  chooseProduct(activeArchive.linkedTime as ProductId);
                  setSheetMode("timer");
                }}
              >
                进入 {activeArchive.linkedTime} MIN 计时
              </button>
            ) : null}
          </article>
        ) : null}

        {sheetMode === "archive" ? (
          <section className="sheet-archive sheet-safe-content" data-testid="archive-sheet">
            <span className="archive-number">02</span>
            <p className="sheet-lead">檀晷把品牌叙事与产品证据放在同一份档案里。当前为概念验证阶段；只有完成实体样品与检测后，目标时长才能升级为正式参数。</p>
            <div><span>01</span><strong>晨白 · 15 MIN</strong><small>清晨与开始</small></div>
            <div><span>02</span><strong>晷墨 · 30 MIN</strong><small>静读与专注</small></div>
            <div><span>03</span><strong>檀褐 · 45 MIN</strong><small>晚间与沉浸</small></div>
            <section className="evidence-ledger" aria-label="产品验证状态">
              <span>EVIDENCE STATUS</span>
              <h3>产品证据，不使用想象值替代</h3>
              <dl>
                <div><dt>英雄单品</dt><dd>30 MIN 晷墨</dd></div>
                <div><dt>燃烧时长</dt><dd>待三批样品实测</dd></div>
                <div><dt>原料来源</dt><dd>待供应链文件</dd></div>
                <div><dt>安全检测</dt><dd>按 GB 26386-2025 规划</dd></div>
                <div><dt>数字记录</dt><dd>本机完成 {completedSessions["15"] + completedSessions["30"] + completedSessions["45"]} 次</dd></div>
              </dl>
            </section>
            <div className="archive-meaning">
              <span>LOGO NOTE</span>
              <h3>刻度、日影与正在燃烧的香</h3>
              <p>圆形刻度取意日晷，指针同时像一支正在燃烧的线香。余烬红的小点，是时间正在发生的标记。</p>
            </div>
          </section>
        ) : null}
      </BottomSheet>
    </>
  );
}
