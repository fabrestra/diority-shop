/**
 * Поиск по каталогу, терпимый к тому, как люди реально печатают:
 * лишние пробелы, регистр, «ё», дефисы, русские названия брендов («стим», «фри фаер»),
 * раскладка («ыеуфь» → «steam») и одна-две опечатки («perplexty», «спотифай»).
 * Без сети и без ИИ: всё считается в браузере за миллисекунды.
 */

/** Русские и разговорные названия → то, что встречается в названиях товаров */
const ALIASES: Record<string, string> = {
  стим: "steam", стиме: "steam", стима: "steam",
  пабг: "pubg", пубг: "pubg", пубж: "pubg", ус: "uc", юс: "uc",
  геншин: "genshin", геншин_импакт: "genshin",
  фри: "free", фаер: "fire", фаир: "fire", фф: "free fire", ff: "free fire",
  млбб: "mobile legends", мобайл: "mobile", легендс: "legends", mlbb: "mobile legends", ml: "mobile legends",
  чатгпт: "chatgpt", гпт: "chatgpt", gpt: "chatgpt", чат: "chatgpt",
  клод: "claude", клауд: "claude", перплексити: "perplexity", грок: "grok", курсор: "cursor",
  гугл: "google", джемини: "gemini", гемини: "gemini", ютуб: "youtube",
  спотифай: "spotify", спотик: "spotify", нетфликс: "netflix", дискорд: "discord", нитро: "nitro",
  телеграм: "telegram", тг: "telegram", звезды: "stars", звёзды: "stars", звезд: "stars", старс: "stars", премиум: "premium",
  эпл: "apple", апл: "apple", айтюнс: "itunes", аппстор: "app store",
  роблокс: "roblox", робуксы: "robux", робукс: "robux", бравл: "brawl", бравлстарс: "brawl stars",
  клеш: "clash", клэш: "clash", рокстар: "rockstar", гта: "gta",
  мэнус: "manus", манус: "manus", опенкод: "opencode",
  зум: "zoom", квизлет: "quizlet", бусуу: "busuu", курсера: "coursera", пиксарт: "picsart",
  меши: "meshy", трипо: "tripo", хиггсфилд: "higgsfield", хигсфилд: "higgsfield", характер: "character", кай: "character",
};

/** Набрано в русской раскладке вместо английской: «ыеуфь» → «steam» */
const RU = "йцукенгшщзхъфывапролджэячсмитьбю";
const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const fromRuLayout = (s: string) => [...s].map((ch) => { const i = RU.indexOf(ch); return i >= 0 ? EN[i] : ch; }).join("");

export const normalize = (s: string) =>
  s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9+]+/gi, " ").replace(/\s+/g, " ").trim();

const tokens = (s: string) => normalize(s).split(" ").filter(Boolean);

/** Расстояние Дамерау-Левенштейна с ранним выходом при превышении max */
function distance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** Насколько слово запроса совпадает со словами товара: 4 — точно, 3 — начало, 2 — часть, 1 — с опечаткой, 0 — нет */
function wordScore(q: string, words: string[]) {
  let best = 0;
  for (const w of words) {
    if (w === q) return 4;
    if (w.startsWith(q)) { best = Math.max(best, 3); continue; }
    if (q.length >= 3 && w.includes(q)) best = Math.max(best, 2);
    if (q.length >= 4) {
      const allowed = q.length >= 7 ? 2 : 1;
      if (distance(q, w.slice(0, q.length + 1), allowed) <= allowed || distance(q, w, allowed) <= allowed) best = Math.max(best, 1);
    }
  }
  return best;
}

/** Варианты запроса: как есть, с заменой русских названий, в английской раскладке */
function variants(query: string) {
  const base = tokens(query);
  const aliased = tokens(base.map((t) => ALIASES[t] ?? t).join(" "));
  const layout = tokens(fromRuLayout(normalize(query)));
  return [base, aliased, layout].filter((v, i, all) => v.length && all.findIndex((x) => x.join(" ") === v.join(" ")) === i);
}

/**
 * Отбирает и сортирует подходящие позиции. Каждое слово запроса должно найтись
 * (точно, началом слова или с небольшой опечаткой) хотя бы в одном поле товара.
 */
export function smartSearch<T>(items: T[], query: string, text: (item: T) => string): T[] {
  const vs = variants(query);
  if (!vs.length) return items;
  const scored: { item: T; score: number; i: number }[] = [];
  items.forEach((item, i) => {
    const words = tokens(text(item));
    let best = 0;
    for (const v of vs) {
      let sum = 0;
      for (const q of v) {
        const s = wordScore(q, words);
        if (!s) { sum = 0; break; }
        sum += s;
      }
      best = Math.max(best, sum);
    }
    if (best) scored.push({ item, score: best, i });
  });
  return scored.sort((a, b) => b.score - a.score || a.i - b.i).map((s) => s.item);
}
