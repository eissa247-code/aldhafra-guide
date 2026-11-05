# -*- coding: utf-8 -*-
"""Builds three standalone Arabic courses (ChatGPT / Copilot 365 / Gemini) from combined-source.html.
Fonts are embedded as base64 so each HTML file is fully self-contained."""
import re, base64, pathlib
HERE = pathlib.Path(__file__).parent
OUT = HERE.parent
src = (HERE / "combined-source.html").read_text(encoding="utf-8")

def b64(name):
    return base64.b64encode((HERE / "fonts" / name).read_bytes()).decode()

head_css = re.search(r"<head>.*?</head>", src, re.S).group(0)
for w, f in ((400, "Cairo-Regular.ttf"), (700, "Cairo-Bold.ttf"), (900, "Cairo-Black.ttf")):
    head_css = head_css.replace(f"url(fonts/{f})", f"url(data:font/ttf;base64,{b64(f)})")

sections = {}
for m in re.finditer(r'<section class="mod[^"]*" id="m(\d+)">(.*?)</section>', src, re.S):
    sections[int(m.group(1))] = m.group(2)

COURSES = {
 "chatgpt": dict(name="ChatGPT", file="chatgpt-course", color="#10a37f", cls="gpt", tool_mods=[4, 5],
   title="دورة ChatGPT<br>من الصفر إلى الاحتراف", sub="ChatGPT من OpenAI",
   need="<li>حساب ChatGPT (النسخة المجانية تكفي للوحدة 3، ويُفضّل المدفوعة للوحدة 4 لتجربة المشاريع وGPTs).</li>",
   auto="<li>عبر واجهات برمجية (APIs) لدمج النماذج في أنظمتك — مجال للمطورين.</li><li>اربط ChatGPT بخدماتك عبر الموصّلات والمهام المجدولة (بحسب الباقة) بحذر وبأقل صلاحيات.</li><li>أدوات أتمتة خارجية (مثل Zapier وMake) تتيح ربطه بتطبيقات أخرى.</li>",
   projects="""<tr><td>أ) حزمة عمل أسبوعية</td><td>سلسلة أوامر تنتج تقريرًا أسبوعيًا: جمع ← تحليل ← تقرير ← بريد متابعة. قِس الوقت الموفر.</td></tr>
  <tr><td>ب) مساعد GPT متخصص</td><td>ابنِ GPT لمهمة محددة مع تعليمات وقيود وملفات مرجعية، واختبره على 10 حالات.</td></tr>
  <tr><td>ج) مشروع (Project) متكامل</td><td>أنشئ مشروعًا بتعليمات وملفات ينتج مخرجًا مهنيًا (خطة، تقرير، حقيبة تدريب) عبر عدة محادثات.</td></tr>
  <tr><td>د) سياسة وحوكمة</td><td>سياسة استخدام + تصنيف بيانات + خطة تدريب لفريق من 10 أشخاص.</td></tr>""",
   plan3="بناء مساعد GPT أو مشروع لمهمة فريقك", res="<li>مركز مساعدة OpenAI وأكاديمية OpenAI.</li><li>صفحات ملاحظات الإصدار في ChatGPT لمتابعة الميزات الجديدة.</li>",
   sec113="""<h3>11.3 ضبط الحماية في ChatGPT</h3>
 <ul>
  <li>راجع ضوابط البيانات: هل تُستخدم محادثاتك لتحسين النماذج؟ (تختلف الخيارات بحسب الباقة).</li>
  <li>استخدم المحادثات المؤقتة للمواضيع الحساسة التي لا تريد حفظها.</li>
  <li>راجع الذاكرة دوريًا واحذف ما لا تريد بقاءه.</li>
  <li>انتبه عند تفعيل الموصّلات أو استخدام GPTs من أطراف خارجية: قد تُرسل بياناتك لخدمات أخرى.</li>
  <li>حسابات الفرق والمؤسسات لها سياسات خصوصية مختلفة عن الحسابات الفردية؛ اعتمد ما تقره جهتك.</li>
 </ul>""",
   quiz11=("هل يصح استخدام حساب ChatGPT شخصي لبيانات عميل سرية؟","لا، إلا إذا سمحت سياسة جهتك صراحة؛ استخدم الحساب والباقة المعتمدين، وأخفِ الهوية قدر الإمكان."),
   resfooter="ChatGPT وOpenAI علامتان تجاريتان لمالكيهما، ولا ترتبط هذه الدورة بأي جهة منهما."),
 "copilot": dict(name="Microsoft 365 Copilot", file="copilot365-course", color="#0f6cbd", cls="cop", tool_mods=[6, 7],
   title="دورة Microsoft 365 Copilot<br>من الصفر إلى الاحتراف", sub="Word · Excel · PowerPoint · Outlook · Teams",
   need="<li>حساب عمل مفعّل عليه Microsoft 365 Copilot (مرخّص) للتجربة الكاملة. وإن لم يتوفر، يمكنك تطبيق المفاهيم عبر Copilot Chat المجاني بحساب العمل.</li><li>تواصل مع مسؤول تقنية المعلومات لمعرفة ما هو مفعّل لديكم.</li>",
   auto="<li>Power Automate وCopilot Studio لربط الوكلاء بالإجراءات.</li><li>الإجراءات المجدولة وسير الموافقات داخل Microsoft 365.</li><li>واجهات برمجية لدمج النماذج في أنظمتك — مجال للمطورين.</li>",
   projects="""<tr><td>أ) سير عمل الاجتماع</td><td>Teams (ملخص) ← Word (محضر) ← PowerPoint (عرض) ← Outlook (متابعة). قِس الوقت الموفر.</td></tr>
  <tr><td>ب) وكيل Copilot مخصص</td><td>ابنِ وكيلًا لمهمة محددة مرتبطًا بمصدر معتمد، وحدد قيوده، واختبره على 10 أسئلة.</td></tr>
  <tr><td>ج) تحليل وعرض</td><td>حلّل ملف Excel حقيقيًا بمساعدة Copilot ثم حوّل النتائج إلى عرض تنفيذي من 6 شرائح مع التحقق من الأرقام.</td></tr>
  <tr><td>د) سياسة وحوكمة</td><td>سياسة استخدام + تصنيف بيانات + مراجعة صلاحيات + خطة تدريب لفريق من 10 أشخاص.</td></tr>""",
   plan3="بناء وكيل أو سير عمل مخصص لمهمة فريقك", res="<li>Microsoft Learn ومركز تبنّي Copilot.</li><li>مركز الرسائل في مركز إدارة Microsoft 365 لمتابعة التغييرات (للمسؤولين).</li>",
   sec113=None,
   quiz11=None,
   resfooter="Microsoft وCopilot وWord وExcel وPowerPoint وOutlook وTeams علامات تجارية لمالكيها، ولا ترتبط هذه الدورة بأي جهة منها."),
 "gemini": dict(name="Google Gemini", file="gemini-course", color="#8b5cf6", cls="gem", tool_mods=[8, 9],
   title="دورة Google Gemini<br>من الصفر إلى الاحتراف", sub="Gemini · Google Workspace · NotebookLM",
   need="<li>حساب Google (المجاني يكفي لمعظم التمارين).</li><li>للتمارين المتعلقة بـ Gmail وDocs وSheets: حساب يتيح تفعيل Gemini في تطبيقات Workspace (بحسب الترخيص).</li>",
   auto="<li>Apps Script وأدوات الأتمتة في Workspace (بحسب التوفر).</li><li>ربط Gemini بالتطبيقات المفعّلة لديك مع مراجعة الصلاحيات.</li><li>واجهات برمجية (APIs) لدمج النماذج في أنظمتك — مجال للمطورين.</li>",
   projects="""<tr><td>أ) حزمة عمل أسبوعية</td><td>سلسلة أوامر تنتج تقريرًا أسبوعيًا: جمع ← تحليل ← تقرير ← بريد متابعة. قِس الوقت الموفر.</td></tr>
  <tr><td>ب) مساعد Gem</td><td>ابنِ Gem لمهمة محددة مع تعليمات وقيود واختبره على 10 حالات.</td></tr>
  <tr><td>ج) قاعدة معرفة</td><td>اجمع 10 مصادر في NotebookLM وأنتج دليل دراسة وأسئلة وملخصًا تنفيذيًا موثقًا.</td></tr>
  <tr><td>د) سياسة وحوكمة</td><td>سياسة استخدام + تصنيف بيانات + خطة تدريب لفريق من 10 أشخاص.</td></tr>""",
   plan3="بناء Gem أو دفتر NotebookLM لمهمة فريقك", res="<li>صفحات مساعدة Gemini وNotebookLM.</li><li>Google Skills للتدريب الرسمي.</li>",
   sec113="""<h3>11.3 ضبط الحماية في Gemini</h3>
 <ul>
  <li>راجع إعدادات «نشاط تطبيقات Gemini»: حفظ المحادثات ومدة الاحتفاظ وإمكانية استخدامها للتحسين.</li>
  <li>للتطبيقات المرتبطة (Gmail، Drive...) فعّل ما تحتاجه فقط وراجع الصلاحيات.</li>
  <li>في حسابات العمل والتعليم تحكم سياسات مسؤول النطاق؛ اعتمد ما تقره جهتك.</li>
  <li>في NotebookLM أضف مصادر أنت مخوّل باستخدامها فقط.</li>
 </ul>""",
   quiz11=("هل يصح وضع بيانات عمل سرية في حساب Gemini الشخصي؟","لا، إلا إذا سمحت سياسة جهتك صراحة؛ استخدم حساب العمل المعتمد، وأخفِ الهوية قدر الإمكان."),
   resfooter="Google وGemini وNotebookLM علامات تجارية لمالكيها، ولا ترتبط هذه الدورة بأي جهة منها."),
}
LEVEL = {1: "مبتدئ", 3: "مبتدئ", 2: "متوسط", 4: "متوسط", 5: "محترف", 6: "محترف", 7: "محترف"}

def build(key, c):
    order = [1, 3] + c["tool_mods"] + [10, 11, 12]          # old module ids
    # new numbering: 0 intro, 1 basics, 2 prompting, 3-4 tool, 5 pro, 6 security, 7 final
    new = {1: 1, 3: 2, c["tool_mods"][0]: 3, c["tool_mods"][1]: 4, 10: 5, 11: 6, 12: 7}
    body, toc = [], []
    # ---- module 0
    mod0 = f"""<section class="mod nobreak" id="m0">
 <h2>الوحدة 0 · كيف تستفيد من الدورة</h2>
 <div class="goal"><b class="t">هدف الدورة</b>أن تنتقل من مستخدم يجرّب أسئلة عشوائية إلى محترف في {c['name']}: يبني أوامر دقيقة، ويدمج الأداة في عمله اليومي بأمان، ويقيس الأثر بوضوح.</div>
 <h3>مستويات الدورة</h3>
 <table>
  <tr><th>المستوى</th><th>الوحدات</th><th>ما ستتقنه</th></tr>
  <tr><td><span class="tag">مبتدئ</span></td><td>1 و3</td><td>فهم الفكرة، وأول خطواتك مع {c['name']}</td></tr>
  <tr><td><span class="tag">متوسط</span></td><td>2 و4</td><td>كتابة أوامر فعّالة، والاستخدام المتقدم للأداة</td></tr>
  <tr><td><span class="tag t-pro">محترف</span></td><td>5 – 7</td><td>سلاسل العمل، الأتمتة، الحوكمة، مشروع ختامي</td></tr>
 </table>
 <h3>طريقة الدراسة المقترحة</h3>
 <ul>
  <li><b>المدة:</b> 3 – 4 أسابيع بمعدل 45 – 60 دقيقة يوميًا.</li>
  <li><b>القاعدة الذهبية:</b> لا تقرأ وحدة دون تنفيذ تمرينها فعليًا على الأداة.</li>
  <li><b>دفتر الأوامر:</b> أنشئ ملفًا تحفظ فيه كل أمر نجح معك مع ملاحظة عن سبب نجاحه. سيصبح أثمن ما تخرج به.</li>
 </ul>
 <h3>ما تحتاجه</h3>
 <ul>{c['need']}</ul>
 <div class="warn"><b class="t">تنبيه مهم عن تغيّر الأدوات</b>تتحدث هذه الأدوات بوتيرة سريعة: تتغير الأسماء والباقات والأزرار وأماكن الخيارات كل بضعة أشهر. ركّزنا في الدورة على <b>المفاهيم والمهارات الثابتة</b>، وحيث ذكرنا ميزة بعينها فتحقق من توفرها في حسابك وباقتك قبل الاعتماد عليها.</div>
</section>"""
    parts = [(0, mod0)]
    for old in order:
        s = sections[old]; n = new[old]
        s = re.sub(r"<h2>الوحدة \d+ ·", f"<h2>الوحدة {n} ·", s)
        s = re.sub(r"<h3>%d\.(\d+) " % old, lambda m: f"<h3>{n}.{m.group(1)} ", s)
        s = s.replace('class="mod"', 'class="mod"')
        parts.append((n, s, old))
    out_secs = []
    exnum = 0
    for p in parts:
        n, s = p[0], p[1]
        old = p[2] if len(p) > 2 else 0
        if old == 1:
            s = s.replace("أدواتنا الثلاث تعتمد على", "الأداة التي ندرسها تعتمد على")
            s = s.replace("اطلب من أداتين مختلفتين السؤال نفسه:", "اطلب من الأداة السؤال نفسه بصيغتين (قصيرة ومفصّلة):")
        if old == 3:
            s = s.replace("المهارة المشتركة بين الأدوات الثلاث: كتابة أمر", f"المهارة الأهم في {c['name']}: كتابة أمر")
            s = s.replace("نفّذهما على أداتين وقارن النتائج", "نفّذهما على الأداة وقارن النتائج")
        if old == 10:
            s = re.sub(r'class="card (gpt|cop|gem)"', f'class="card {c["cls"]}"', s)
            s = re.sub(r"(<h3>5\.6 أتمتة سير العمل</h3>\s*)<ul>.*?</ul>", lambda m: m.group(1) + "<ul>" + c["auto"] + "</ul>", s, flags=re.S)
        if old == 11:
            if c["sec113"]:
                s = re.sub(r"<h3>6\.3 .*?(?=<h3>6\.4)", lambda m: c["sec113"].replace("11.3", "6.3") + "\n\n ", s, flags=re.S)
                s = re.sub(r"<details><summary>هل يكفي أن «Copilot.*?</details>", lambda m: f"<details><summary>{c['quiz11'][0]}</summary>{c['quiz11'][1]}</details>", s, flags=re.S)
        if old == 12:
            s = re.sub(r"(<h3>7\.1 .*?<table>\s*<tr><th>المشروع</th><th>المطلوب</th><th>الأدوات</th></tr>).*?</table>",
                       lambda m: m.group(1).replace("<th>الأدوات</th>", "") + "\n  " + c["projects"] + "\n </table>", s, flags=re.S)
            s = s.replace("أحدد الأداة الأنسب لكل مهمة وأعرف السبب.", f"أعرف نقاط قوة {c['name']} وحدوده وأختار المهام المناسبة له.")
            s = s.replace("بناء مساعد مخصص (GPT/Gem/وكيل) لمهمة فريقك", c["plan3"])
            s = re.sub(r"(<h3>7\.5 .*?<ul>).*?(</ul>)", lambda m: m.group(1) + "\n  " + c["res"] + "\n  <li>التوثيق الرسمي للأداة هو المرجع الأحدث للميزات والباقات.</li>\n " + m.group(2), s, flags=re.S)
            s = s.replace("أُتمّ الدورة «الذكاء الاصطناعي في العمل: من الصفر إلى الاحتراف»", f"أُتمّ دورة «{c['name']}: من الصفر إلى الاحتراف»")
        # sequential exercise numbers
        def ex(m):
            nonlocal exnum
            exnum += 1
            return f'<b class="t">تمرين {exnum}'
        s = re.sub(r'<b class="t">تمرين \d+', ex, s)
        out_secs.append((n, s))
    for n, s in out_secs:
        if n == 0:
            out_secs_html = s
        s = re.sub(r'<section class="mod(?:[^"]*)" id="m\d+">', "", s)
    html_secs = []
    for n, s in out_secs:
        if n == 0:
            html_secs.append(s); continue
        html_secs.append(f'<section class="mod" id="m{n}">{s}</section>')
    toc_items = []
    for n, s in out_secs:
        t = re.search(r"<h2>الوحدة \d+ · (.*?)</h2>", s).group(1)
        toc_items.append(f'<li><a href="#m{n}">{t}</a></li>')
    full = "".join(html_secs)
    n_prompts = len(re.findall(r"<pre>", full))
    n_ex = exnum
    cover = f"""<header class="cover"><div class="wrap">
  <p>دورة تطبيقية شاملة</p>
  <h1>{c['title']}</h1>
  <p>{c['sub']}</p>
  <div class="pills"><span class="pill">8 وحدات</span><span class="pill">{n_prompts} نموذج أمر جاهز</span><span class="pill">{n_ex} تمارين ومشروع ختامي</span><span class="pill">اختبارات قصيرة</span></div>
  <p style="margin-top:34px;font-size:16px">النسخة 1.0 · نوفمبر 2026</p>
 </div></header>"""
    nav = f'<nav class="toc"><h2>فهرس الدورة</h2><ol start="0">{"".join(toc_items)}</ol></nav>'
    footer = f'<footer><div class="wrap">دورة «{c["name"]}: من الصفر إلى الاحتراف» · محتوى تعليمي عام<br>{c["resfooter"]} تتغير الميزات والباقات باستمرار، فتحقق من التوثيق الرسمي.</div></footer>'
    css = head_css.replace("--brand:#4f46e5", f"--brand:{c['color']}")
    css = css.replace("<title>دورة الذكاء الاصطناعي من الصفر إلى الاحتراف</title>", f"<title>دورة {c['name']} من الصفر إلى الاحتراف</title>")
    css = css.replace("linear-gradient(135deg,#312e81,#4f46e5 55%,#0ea5e9)", f"linear-gradient(135deg,#111827,{c['color']} 70%,#0ea5e9)")
    doc = f'<!doctype html>\n<html lang="ar" dir="rtl">\n{css}\n<body>\n{cover}\n<main class="wrap">\n{nav}\n{"".join(html_secs)}\n</main>\n{footer}\n</body>\n</html>\n'
    (OUT / f"{c['file']}.html").write_text(doc, encoding="utf-8")
    print(key, "prompts", n_prompts, "ex", n_ex, len(doc) // 1024, "KB")

for k, c in COURSES.items():
    build(k, c)
