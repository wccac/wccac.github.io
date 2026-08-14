import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { BottomSheet, Carousel, MobileScroll } from "./mobile";

type ProductId = "15" | "30" | "45";
type SheetMode = "product" | "tray" | "timer" | "archive" | null;

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
    image: string;
  }
> = {
  "15": {
    minutes: 15,
    name: "晨白",
    english: "MORNING IVORY",
    specimen: "TIME SPECIMEN 01",
    color: "#E7E0D4",
    use: "晨间醒神",
    note: "清透、短暂、利落。适合更衣、沏茶与开始工作前的一刻。",
    scent: "清透木质 · 轻柔微甜",
    space: "晨间书桌 / 玄关",
    ritual: "留一道窗隙，燃一支香。在水沸之前，让注意力缓慢回到眼前。",
    image: "/assets/tangui/open-15.png",
  },
  "30": {
    minutes: 30,
    name: "晷墨",
    english: "SUNDIAL INK",
    specimen: "TIME SPECIMEN 02",
    color: "#151713",
    use: "静读专注",
    note: "温润木香缓慢展开，留出一段不被打断的阅读与独处时间。",
    scent: "温润檀木 · 安静回甘",
    space: "书房 / 茶席",
    ritual: "整理桌面，翻开要读的一页。香气开始稳定时，进入一段完整的静读。",
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
    image: "/assets/tangui/open-45.png",
  },
};

const PRODUCT_ORDER: ProductId[] = ["15", "30", "45"];
const CENTER_LOOP_CYCLE = 3;
const LOOPED_PRODUCTS = Array.from({ length: 7 }, (_, cycle) =>
  PRODUCT_ORDER.map((id) => ({ id, cycle })),
).flat();
const NAV_ITEMS = ["香品", "计时", "档案"] as const;

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
  const carouselNodeRef = useRef<HTMLDivElement | null>(null);
  const selected = PRODUCTS[selectedId];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "檀晷 · 时间档案";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    setSecondsLeft(PRODUCTS[selectedId].minutes * 60);
    setTimerRunning(false);
  }, [selectedId]);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timerRunning]);

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

  const sheetCopy = useMemo(() => {
    if (sheetMode === "tray") {
      return { title: "香托", description: "INCENSE TRAY · 矿物灰" };
    }
    if (sheetMode === "timer") {
      return { title: `${selected.minutes} 分钟计时`, description: `${selected.name} · ${selected.use}` };
    }
    if (sheetMode === "archive") {
      return { title: "时间档案", description: "TÁN GUǏ / TIME ARCHIVE" };
    }
    return { title: `${selected.minutes} MIN · ${selected.name}`, description: selected.specimen };
  }, [selected, sheetMode]);

  const sheetSnap = sheetMode === "timer" ? 0.6 : sheetMode === "archive" ? 0.76 : 0.72;

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
              <p>15 分钟醒神，30 分钟静读，45 分钟沉入一席香事。</p>
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

            <section className="brand-story" aria-labelledby="brand-story-title">
              <span className="section-kicker">BRAND NOTE 01</span>
              <h2 id="brand-story-title">以香为尺，读一寸时间</h2>
              <p>“晷”是日影留下的刻度。檀晷把线香的燃烧长度转译成 15、30、45 分钟三种时间标本，让香气不只是气味，也是日常节奏的一部分。</p>
              <dl>
                <div><dt>日晷</dt><dd>标记时间秩序</dd></div>
                <div><dt>木纹</dt><dd>保存檀木触感</dd></div>
                <div><dt>香长</dt><dd>对应使用情境</dd></div>
              </dl>
            </section>

            <section className="time-guide" aria-labelledby="time-guide-title">
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
              <div><dt>燃香时长</dt><dd>{selected.minutes} MIN</dd></div>
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

        {sheetMode === "archive" ? (
          <section className="sheet-archive sheet-safe-content" data-testid="archive-sheet">
            <span className="archive-number">02</span>
            <p className="sheet-lead">檀晷以日晷为秩序、以檀木为触感，把不同燃香时长编成可收藏的时间标本。</p>
            <div><span>01</span><strong>晨白 · 15 MIN</strong><small>清晨与开始</small></div>
            <div><span>02</span><strong>晷墨 · 30 MIN</strong><small>静读与专注</small></div>
            <div><span>03</span><strong>檀褐 · 45 MIN</strong><small>晚间与沉浸</small></div>
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
