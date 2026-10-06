/* graph.js —— 五脏知识图谱（Obsidian 关系图谱式·力导向·纯原生）
   拖拽节点 / 悬停高亮邻域 / 点击查看详情 / 滚轮缩放 / 画布平移
   v2：方剂全组成中药 + 症状 + 舌象 + 脉象知识节点 */

const G_NODES = [
  // 五脏（大）
  { id: "心", cat: "zang", d: "君主之官，主血脉、藏神。心悸病位核心——《素问》心主血脉，《伤寒论》177 条心动悸。" },
  { id: "肝", cat: "zang", d: "将军之官，主疏泄、藏魂。怒伤肝，肝气逆乱扰心神——情志诱发心悸之源。" },
  { id: "脾", cat: "zang", d: "仓廪之官，气血生化之源。脾虚则血不养心（归脾汤法）——真实世界最常见证型背景。" },
  { id: "肺", cat: "zang", d: "相傅之官，主治节、朝百脉。肺气虚则宗气不足，心脉失助（张锡纯大气下陷致怔忡）。" },
  { id: "肾", cat: "zang", d: "作强之官，藏精主水。水亏火旺（阴虚火旺）/水饮凌心（心衰表型）——心肾相交之轴。" },
  // 五志/五体
  { id: "怒", cat: "zhi", d: "肝之志——怒伤肝，肝气上逆扰心（《素问》悲哀愁忧则心动）。" },
  { id: "喜", cat: "zhi", d: "心之志——过喜伤心，神散不敛。" },
  { id: "思", cat: "zhi", d: "脾之志——思伤脾，思虑耗伤心血（《严氏济生方》汲汲富贵真血虚耗）。" },
  { id: "悲", cat: "zhi", d: "肺之志——悲伤肺，气消而宗气不足。" },
  { id: "恐", cat: "zhi", d: "肾之志——恐伤肾，精却而心无所依（《素问·举痛论》惊则心无所倚）。" },
  { id: "脉", cat: "ti", d: "心之体——心主血脉，脉结代心动悸为心病之征。" },
  { id: "舌", cat: "ti", d: "心之窍——舌为心之苗，舌尖红主心火，舌淡主心血虚。" },
  // 证型
  { id: "心虚胆怯", cat: "syn", d: "触事易惊、善惊心悸。治：镇惊定志——安神定志丸合酸枣仁汤。临床关联最强（HRV 降低）。", act: "syn" },
  { id: "心脾两虚", cat: "syn", d: "心悸气短、乏力纳呆、面色无华。治：补血养心——归脾汤。真实世界 902 例居首。", act: "syn" },
  { id: "阴虚火旺", cat: "syn", d: "心悸盗汗、口干烦躁、舌红少苔。治：滋阴降火——天王补心丹合黄连阿胶汤。", act: "syn" },
  { id: "心阳不振", cat: "syn", d: "心悸肢冷、畏寒气短、脉迟弱。治：温补心阳——桂甘龙牡汤合参附汤。EF↓BNP↑。", act: "syn" },
  { id: "水饮凌心", cat: "syn", d: "心悸浮肿、喘促尿少、苔腻脉滑。治：温阳利水——真武汤合苓桂术甘汤。BNP 最高表型。", act: "syn" },
  { id: "心脉瘀阻", cat: "syn", d: "胸痛胸闷、舌紫暗、脉涩结。治：活血化瘀——血府逐瘀汤。D-二聚体最高（促凝端）。", act: "syn" },
  { id: "痰火扰心", cat: "syn", d: "惊悸烦躁、失眠多梦、苔黄腻脉滑。治：清热化痰——黄连温胆汤。代谢表型。", act: "syn" },
  // 方剂
  { id: "炙甘草汤", cat: "fang", d: "《伤寒论》177 条——脉结代心动悸第一方（复脉汤）。九味：炙甘草/生姜/人参/生地/桂枝/阿胶/麦冬/麻仁/大枣。清酒同煎。" },
  { id: "归脾汤", cat: "fang", d: "《严氏济生方》严用和八味原方（+当归远志十味）——心脾两虚主方，全库归脾类 21 篇 RCT。" },
  { id: "真武汤", cat: "fang", d: "《伤寒论》82 条——阳虚水泛心下悸。五味：茯苓/芍药/生姜/白术/附子（炮）。水饮凌心/心衰主方。" },
  { id: "温胆汤", cat: "fang", d: "《严氏济生方》温胆汤→《世医得效方》十味温胆汤（+枣仁远志五味熟地参）——严氏→危氏方书传承链。" },
  { id: "桂甘龙牡汤", cat: "fang", d: "《伤寒论》118 条——四味：桂枝/甘草/龙骨/牡蛎。温心阳+镇心神。RCT 95.12% 锚点。" },
  { id: "天王补心丹", cat: "fang", d: "《校注妇人良方》——十三味滋阴养血安神。生地四两为君。" },
  { id: "黄连阿胶汤", cat: "fang", d: "《伤寒论》303 条——心中烦不得卧。五味：黄连/黄芩/芍药/鸡子黄/阿胶。泻南补北。" },
  { id: "血府逐瘀汤", cat: "fang", d: "《医林改错》王清任——胸中血府血瘀。桃红四物+四逆散+桔梗牛膝升降对。" },
  { id: "安神定志丸", cat: "fang", d: "《医学心悟》——人参/茯苓/茯神/菖蒲/远志/龙齿。开心散加茯神龙齿法。" },
  { id: "苓桂术甘汤", cat: "fang", d: "《伤寒论》67 条——温阳化饮第一方。四味：茯苓四两/桂枝/白术/甘草。" },
  // 中药（全组成）
  { id: "甘草", cat: "yao", d: "炙甘草汤君药——益气补中、通经脉利血气。语境 2667 次居首。和百药。" },
  { id: "人参", cat: "yao", d: "益气安神核心——「人参入心者重」（《本草思辨录》）。语境 2340 次。归脾/炙甘草/十味温胆/补心/定志五方共用。" },
  { id: "茯苓", cat: "yao", d: "健脾宁心利水——现代病例 TOP1（49.3%）。苓桂/真武/温胆/补心/定志五方共用。" },
  { id: "远志", cat: "yao", d: "安神配伍枢纽——茯神+远志 lift 3.38（全库最高药对）。归脾/十味温胆/补心/定志四方共用。" },
  { id: "酸枣仁", cat: "yao", d: "养心安神敛汗——「酸枣仁最治虚汗」（《顾松园医镜》）。归脾/十味温胆/补心三方。" },
  { id: "桂枝", cat: "yao", d: "温通心阳——桂枝甘草汤（64 条）核心，复脉法之基。炙甘草/桂甘龙牡/苓桂三方。" },
  { id: "附子", cat: "yao", d: "回阳救逆——真武汤用（⚠️ 有毒，遵医嘱）。郑钦安「重藏阳」。" },
  { id: "丹参", cat: "yao", d: "活血祛瘀清心——现代病例 TOP2（38.8%）。「一味丹参，功同四物」。" },
  { id: "当归", cat: "yao", d: "养血和血——归脾/补心/血府三方。语境 1600 次。当归+川芎=佛手散。" },
  { id: "生地", cat: "yao", d: "滋阴养血——炙甘草汤一斤（君药之争 contested）、补心四两为君。充脉复脉。" },
  { id: "阿胶", cat: "yao", d: "滋阴补血——炙甘草/黄连阿胶两方。烊化兑入，血肉有情。" },
  { id: "麦冬", cat: "yao", d: "养阴生津——炙甘草/补心（二冬）。麦冬+五味=生脉散对。" },
  { id: "麻仁", cat: "yao", d: "润燥滑利脉道——炙甘草汤佐使。增液行舟。" },
  { id: "生姜", cat: "yao", d: "温胃散水、和中——炙甘草/真武/温胆（姜枣为引）。" },
  { id: "大枣", cat: "yao", d: "补脾和胃、养血安神——炙甘草汤三十枚。姜枣调和营卫对。" },
  { id: "黄芪", cat: "yao", d: "补气升阳——归脾汤君药之一。黄芪+当归=当归补血汤（5:1）。" },
  { id: "龙眼肉", cat: "yao", d: "养血安神——归脾汤君药之一。龙眼+枣仁=养血安神对。" },
  { id: "白术", cat: "yao", d: "健脾燥湿——归脾/真武/苓桂三方。白术+茯苓=健脾利水对。" },
  { id: "木香", cat: "yao", d: "行气醒脾——归脾汤佐药「补而不滞」范式。" },
  { id: "茯神", cat: "yao", d: "宁心安神——茯神+远志 lift 3.38 全库第一药对。归脾/补心/定志三方。" },
  { id: "芍药", cat: "yao", d: "敛阴和营、缓急——真武/黄连阿胶。制刚燥、和血脉。" },
  { id: "半夏", cat: "yao", d: "燥湿化痰、和胃——温胆汤君。半夏+陈皮=二陈核心对；半夏+夏枯草=昼夜安寐对。" },
  { id: "陈皮", cat: "yao", d: "理气化痰——温胆/二陈。半夏+陈皮 lift 1.75。" },
  { id: "枳实", cat: "yao", d: "破气消积、化痰——温胆汤臣。枳实+竹茹=清胆和胃对。" },
  { id: "竹茹", cat: "yao", d: "清热化痰除烦——温胆汤臣。痰火扰心要药。" },
  { id: "熟地", cat: "yao", d: "滋阴补血——十味温胆汤加味。人参+熟地=益气养血对。" },
  { id: "五味子", cat: "yao", d: "收敛固涩、益气生津——十味温胆/补心。五味+枣仁=酸收敛心对。" },
  { id: "龙骨", cat: "yao", d: "重镇安神——桂甘龙牡/安神定志（龙齿）。龙骨+牡蛎=镇摄对（张锡纯：敛正不敛邪）。" },
  { id: "牡蛎", cat: "yao", d: "重镇潜阳——桂甘龙牡。龙牡并用镇心神。" },
  { id: "柏子仁", cat: "yao", d: "养心安神润燥——天王补心丹。枣仁+柏子仁=养心安神对。" },
  { id: "天冬", cat: "yao", d: "滋阴清热——天王补心丹。天冬+麦冬=二冬对。" },
  { id: "玄参", cat: "yao", d: "滋阴降火——天王补心丹。丹参+玄参=滋阴活血对。" },
  { id: "桔梗", cat: "yao", d: "载药上行舟楫——补心/血府。桔梗+牛膝=升降相因对。" },
  { id: "黄连", cat: "yao", d: "清心泻火——黄连阿胶汤君（四两）。黄连+阿胶=泻南补北对；黄连+肉桂=交泰丸。" },
  { id: "黄芩", cat: "yao", d: "清热燥湿——黄连阿胶汤臣。芩连苦寒直折心火。" },
  { id: "鸡子黄", cat: "yao", d: "滋阴养血安神——黄连阿胶汤佐（小冷冲入）。血肉有情。" },
  { id: "桃仁", cat: "yao", d: "活血化瘀——血府逐瘀汤君。桃仁+红花=活血核心对。" },
  { id: "红花", cat: "yao", d: "活血通经——血府逐瘀汤君。" },
  { id: "川芎", cat: "yao", d: "活血行气——血府逐瘀。川芎+当归 lift 2.03（佛手散）。现代病例 35.2%。" },
  { id: "赤芍", cat: "yao", d: "凉血活血——血府逐瘀。赤芍+生地=凉血活血对。" },
  { id: "牛膝", cat: "yao", d: "活血引血下行——血府逐瘀佐。桔梗+牛膝升降对。" },
  { id: "柴胡", cat: "yao", d: "疏肝解郁、升阳——血府逐瘀（四逆散底）。柴胡+枳壳=调畅气机对。" },
  { id: "枳壳", cat: "yao", d: "理气宽胸——血府逐瘀佐。" },
  { id: "石菖蒲", cat: "yao", d: "开窍化痰安神——安神定志丸。远志+菖蒲=开心散对。" },
  { id: "龙齿", cat: "yao", d: "镇惊安神——安神定志丸佐。茯神+龙齿=养心镇惊对。" },
  // 症状
  { id: "心悸", cat: "zheng", d: "自觉心跳悸动不安——本库主症。《伤寒论》心动悸、《济生方》惊悸怔忡分层。" },
  { id: "惊悸", cat: "zheng", d: "因惊而悸、时作时止——轻证（《济生方》）。" },
  { id: "怔忡", cat: "zheng", d: "无惊自悸、持续不宁——重证。《景岳全书》动气论「虚微者动亦微」。" },
  { id: "胸闷", cat: "zheng", d: "胸中窒闷——气滞/痰阻/血瘀。胸闷 V=0.418 为症状关联最强。" },
  { id: "气短", cat: "zheng", d: "呼吸气促不续——心肺气虚（宗气不足）。" },
  { id: "乏力", cat: "zheng", d: "倦怠无力——气血两虚（心脾两虚主症之一）。" },
  { id: "自汗", cat: "zheng", d: "不因劳而汗出——心气虚不敛（「汗为心之液」·郑钦安）。" },
  { id: "盗汗", cat: "zheng", d: "寐中汗出——阴虚火旺。" },
  { id: "失眠", cat: "zheng", d: "不得寐——心神不宁。痰火/阴虚/心脾三端。" },
  { id: "多梦", cat: "zheng", d: "寐中梦扰——血不养神/痰火扰心。" },
  { id: "头晕", cat: "zheng", d: "清窍失养——气血亏虚/痰饮上冲（真武汤头眩）。" },
  { id: "浮肿", cat: "zheng", d: "水饮泛溢肌肤——水饮凌心主症（阳虚水泛）。" },
  { id: "肢冷", cat: "zheng", d: "四末不温——心阳不振、不能温煦。" },
  { id: "畏寒", cat: "zheng", d: "阳虚畏寒——心肾阳虚。" },
  { id: "口干", cat: "zheng", d: "津液不足——阴虚火旺。" },
  { id: "烦躁", cat: "zheng", d: "心神不宁躁扰——痰火/阴虚火旺（118 条烦躁）。" },
  { id: "善惊", cat: "zheng", d: "触事易惊、胆怯——心虚胆怯主症。" },
  { id: "健忘", cat: "zheng", d: "心脾两虚——《严氏济生方》归脾汤主治怔忡健忘。" },
  { id: "不得卧", cat: "zheng", d: "不得平卧——水饮凌心（心衰端坐呼吸）/黄连阿胶汤证。" },
  { id: "喘促", cat: "zheng", d: "呼吸喘急——水饮凌心、肺失宣降。" },
  { id: "尿少", cat: "zheng", d: "小便不利——阳虚水停（真武汤证）。" },
  { id: "胸痛", cat: "zheng", d: "胸痹心痛——血瘀/阳微阴弦（《金匮要略》总纲）。" },
  // 舌象
  { id: "舌淡苔白", cat: "she", d: "舌淡苔白——气血两虚/阳虚。心脾两虚、心阳不振主舌。" },
  { id: "舌红少苔", cat: "she", d: "舌红少苔/剥苔——阴虚火旺主舌。" },
  { id: "舌紫暗", cat: "she", d: "舌紫暗或瘀斑——血瘀内阻。心脉瘀阻主舌（D-二聚体高）。" },
  { id: "苔腻", cat: "she", d: "苔腻——痰湿/水饮内蕴。苔腻 V=0.276（舌脉关联最强）。" },
  { id: "苔黄腻", cat: "she", d: "苔黄腻——痰热/痰火扰心主舌。" },
  { id: "苔白滑", cat: "she", d: "苔白滑——寒饮内停。水饮凌心主舌。" },
  { id: "舌淡胖", cat: "she", d: "舌淡胖有齿痕——脾肾阳虚、水湿不化。" },
  // 脉象
  { id: "结代脉", cat: "mai", d: "178 条经典定义——结=能自还（预后较好），代=不能自还（难治）。结生代死。" },
  { id: "促脉", cat: "mai", d: "数而时一止——快速型不齐（房颤/房扑）。" },
  { id: "涩脉", cat: "mai", d: "细而迟短——低搏出量、血瘀（涩=低排）。" },
  { id: "脉细弱", cat: "mai", d: "细弱无力——气血两虚。心脾两虚主脉。" },
  { id: "脉数", cat: "mai", d: "一息五至以上——热/虚火。阴虚火旺、痰火主脉。" },
  { id: "脉迟", cat: "mai", d: "一息不足四至——阳虚寒凝。心阳不振主脉（缓/迟）。" },
  { id: "脉弦", cat: "mai", d: "端直以长——肝胆病/痛/惊。心虚胆怯、肝郁主脉。" },
  { id: "脉滑", cat: "mai", d: "往来流利——痰饮/食滞。痰火、水饮主脉（脉滑 V=0.257）。" },
  { id: "脉沉紧", cat: "mai", d: "沉而紧——里寒水饮。苓桂术甘汤证主脉（67 条）。" },
  // 经络
  { id: "手少阴心经", cat: "jing", d: "心系本经——神门、通里治悸要穴。" },
  { id: "手厥阴心包经", cat: "jing", d: "内关宽胸定悸——心悸针灸第一要穴。" },
  { id: "足少阴肾经", cat: "jing", d: "太溪滋水涵火——心肾相交之径。" },
  // 古籍
  { id: "伤寒论", cat: "book", d: "张仲景——177/178/64/82/118/303 条，心悸条文第一源。" },
  { id: "素问", cat: "book", d: "心主血脉/五脏藏象/虚里宗气诊——理论之源。" },
  { id: "金匮要略", cat: "book", d: "胸痹心痛短气篇——阳微阴弦总纲，栝蒌薤白三方。" },
  { id: "严氏济生方", cat: "book", d: "严用和——归脾八味原方+温胆汤方祖，惊悸怔忡健忘门。" },
  { id: "景岳全书", cat: "book", d: "张景岳——动气论「虚微者动亦微」，戒妄清利。" },
];

const G_EDGES = [
  // 脏-志-体
  ["心","喜"],["心","脉"],["心","舌"],["肝","怒"],["脾","思"],["肺","悲"],["肾","恐"],
  // 脏-证型
  ["心","心虚胆怯"],["肝","心虚胆怯"],["心","心脾两虚"],["脾","心脾两虚"],["心","阴虚火旺"],["肾","阴虚火旺"],
  ["心","心阳不振"],["肾","心阳不振"],["心","水饮凌心"],["肾","水饮凌心"],["脾","水饮凌心"],
  ["心","心脉瘀阻"],["肝","心脉瘀阻"],["心","痰火扰心"],["肝","痰火扰心"],["脾","痰火扰心"],
  // 证型-方剂
  ["心虚胆怯","安神定志丸"],["心虚胆怯","温胆汤"],["心脾两虚","归脾汤"],["阴虚火旺","天王补心丹"],["阴虚火旺","黄连阿胶汤"],
  ["心阳不振","桂甘龙牡汤"],["心阳不振","真武汤"],["水饮凌心","真武汤"],["水饮凌心","苓桂术甘汤"],
  ["心脉瘀阻","血府逐瘀汤"],["痰火扰心","温胆汤"],["心","炙甘草汤"],
  // 方剂-中药（全组成）
  ["炙甘草汤","甘草"],["炙甘草汤","生姜"],["炙甘草汤","人参"],["炙甘草汤","生地"],["炙甘草汤","桂枝"],
  ["炙甘草汤","阿胶"],["炙甘草汤","麦冬"],["炙甘草汤","麻仁"],["炙甘草汤","大枣"],
  ["归脾汤","白术"],["归脾汤","茯神"],["归脾汤","黄芪"],["归脾汤","龙眼肉"],["归脾汤","酸枣仁"],
  ["归脾汤","人参"],["归脾汤","木香"],["归脾汤","甘草"],["归脾汤","当归"],["归脾汤","远志"],
  ["桂甘龙牡汤","桂枝"],["桂甘龙牡汤","甘草"],["桂甘龙牡汤","牡蛎"],["桂甘龙牡汤","龙骨"],
  ["真武汤","茯苓"],["真武汤","芍药"],["真武汤","生姜"],["真武汤","白术"],["真武汤","附子"],
  ["温胆汤","半夏"],["温胆汤","竹茹"],["温胆汤","枳实"],["温胆汤","陈皮"],["温胆汤","甘草"],["温胆汤","茯苓"],
  ["温胆汤","酸枣仁"],["温胆汤","远志"],["温胆汤","五味子"],["温胆汤","熟地"],["温胆汤","人参"],
  ["天王补心丹","生地"],["天王补心丹","人参"],["天王补心丹","丹参"],["天王补心丹","玄参"],["天王补心丹","茯苓"],
  ["天王补心丹","五味子"],["天王补心丹","远志"],["天王补心丹","桔梗"],["天王补心丹","当归"],
  ["天王补心丹","天冬"],["天王补心丹","麦冬"],["天王补心丹","柏子仁"],["天王补心丹","酸枣仁"],
  ["黄连阿胶汤","黄连"],["黄连阿胶汤","黄芩"],["黄连阿胶汤","芍药"],["黄连阿胶汤","鸡子黄"],["黄连阿胶汤","阿胶"],
  ["血府逐瘀汤","桃仁"],["血府逐瘀汤","红花"],["血府逐瘀汤","当归"],["血府逐瘀汤","生地"],["血府逐瘀汤","川芎"],
  ["血府逐瘀汤","赤芍"],["血府逐瘀汤","牛膝"],["血府逐瘀汤","桔梗"],["血府逐瘀汤","柴胡"],["血府逐瘀汤","枳壳"],
  ["安神定志丸","人参"],["安神定志丸","茯苓"],["安神定志丸","茯神"],["安神定志丸","石菖蒲"],["安神定志丸","远志"],["安神定志丸","龙齿"],
  ["苓桂术甘汤","茯苓"],["苓桂术甘汤","桂枝"],["苓桂术甘汤","白术"],["苓桂术甘汤","甘草"],
  // 经典对药（跨方强化线）
  ["茯神","远志"],["人参","远志"],["当归","远志"],["桂枝","甘草"],["龙骨","牡蛎"],["桃仁","红花"],
  ["黄连","阿胶"],["桔梗","牛膝"],["柴胡","枳壳"],["半夏","陈皮"],["酸枣仁","柏子仁"],["茯苓","白术"],
  // 脏-脉-经络
  ["心","结代脉"],["心","促脉"],["心","涩脉"],["心","手少阴心经"],["心","手厥阴心包经"],["肾","足少阴肾经"],
  // 脏-书
  ["心","伤寒论"],["心","素问"],["心","金匮要略"],["心","严氏济生方"],["心","景岳全书"],
  // 症状-证型
  ["心","心悸"],["心悸","惊悸"],["心悸","怔忡"],
  ["心虚胆怯","善惊"],["心虚胆怯","失眠"],["心虚胆怯","多梦"],["心虚胆怯","惊悸"],
  ["心脾两虚","乏力"],["心脾两虚","气短"],["心脾两虚","健忘"],["心脾两虚","失眠"],
  ["阴虚火旺","盗汗"],["阴虚火旺","口干"],["阴虚火旺","烦躁"],["阴虚火旺","失眠"],
  ["心阳不振","肢冷"],["心阳不振","畏寒"],["心阳不振","气短"],
  ["水饮凌心","浮肿"],["水饮凌心","喘促"],["水饮凌心","尿少"],["水饮凌心","不得卧"],["水饮凌心","头晕"],
  ["心脉瘀阻","胸痛"],["心脉瘀阻","胸闷"],
  ["痰火扰心","烦躁"],["痰火扰心","不得卧"],["痰火扰心","头晕"],["痰火扰心","胸闷"],["痰火扰心","多梦"],
  ["心","胸闷"],["心","气短"],["心","自汗"],
  // 舌象-证型
  ["心脾两虚","舌淡苔白"],["心阳不振","舌淡苔白"],["心阳不振","舌淡胖"],["心脾两虚","舌淡胖"],
  ["阴虚火旺","舌红少苔"],["心脉瘀阻","舌紫暗"],["痰火扰心","苔黄腻"],
  ["水饮凌心","苔腻"],["水饮凌心","苔白滑"],["痰火扰心","苔腻"],
  // 脉象-证型
  ["心脾两虚","脉细弱"],["阴虚火旺","脉数"],["痰火扰心","脉数"],["心阳不振","脉迟"],
  ["心虚胆怯","脉弦"],["痰火扰心","脉滑"],["水饮凌心","脉滑"],["水饮凌心","脉沉紧"],["心脉瘀阻","涩脉"],["心脉瘀阻","结代脉"],
];

const G_CAT = {
  zang:  { r: 30, color: "#A6382C", font: 17, w: 600 },
  syn:   { r: 16, color: "#7E2820", font: 12, w: 500 },
  fang:  { r: 13, color: "#B08D4F", font: 11, w: 500 },
  yao:   { r: 10, color: "#3E5C50", font: 9.5, w: 500 },
  zheng: { r: 10, color: "#9C5B34", font: 9.5, w: 500 },
  she:   { r: 9.5, color: "#7E6C84", font: 9, w: 500 },
  mai:   { r: 11, color: "#33506B", font: 10, w: 500 },
  jing:  { r: 12, color: "#5F7A6E", font: 10.5, w: 500 },
  book:  { r: 13, color: "#6E6A5E", font: 10.5, w: 500 },
  zhi:   { r: 9, color: "#9A8F7A", font: 9, w: 400 },
  ti:    { r: 9, color: "#9A8F7A", font: 9, w: 400 },
};
const G_CAT_NAME = { zang:"五脏", syn:"证型", fang:"方剂", yao:"中药", zheng:"症状", she:"舌象", mai:"脉象", jing:"经络", book:"古籍", zhi:"五志", ti:"五体" };

function initGraph(canvasId, infoId) {
  const canvas = document.getElementById(canvasId);
  const info = document.getElementById(infoId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, dpr = devicePixelRatio || 1;

  const nodes = G_NODES.map((n, i) => {
    const a = (i / G_NODES.length) * Math.PI * 2;
    return { ...n, x: Math.cos(a) * 230 + (Math.random()-.5)*60, y: Math.sin(a) * 190 + (Math.random()-.5)*60, vx: 0, vy: 0 };
  });
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edges = G_EDGES.map(([a, b]) => ({ a: byId[a], b: byId[b] })).filter(e => e.a && e.b);
  const neighbors = {};
  nodes.forEach(n => neighbors[n.id] = new Set());
  edges.forEach(e => { neighbors[e.a.id].add(e.b.id); neighbors[e.b.id].add(e.a.id); });

  let hover = null, drag = null, pan = { x: 0, y: 0 }, scale = 1;

  function resize() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize(); addEventListener("resize", resize);

  function step() {
    for (const n of nodes) {
      if (n === drag) continue;
      let fx = 0, fy = 0;
      for (const m of nodes) {
        if (m === n) continue;
        let dx = n.x - m.x, dy = n.y - m.y;
        let d2 = dx*dx + dy*dy + 40;
        const rep = (G_CAT[n.cat].r + G_CAT[m.cat].r) * 24 / d2;
        fx += dx * rep; fy += dy * rep;
      }
      n.vx = (n.vx + fx * .02) * .80;
      n.vy = (n.vy + fy * .02) * .80;
    }
    for (const e of edges) {
      const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
      const d = Math.sqrt(dx*dx + dy*dy) || 1;
      const rest = G_CAT[e.a.cat].r + G_CAT[e.b.cat].r + 42;
      const f = (d - rest) * .0055;
      const ux = dx / d * f, uy = dy / d * f;
      if (e.a !== drag) { e.a.vx += ux; e.a.vy += uy; }
      if (e.b !== drag) { e.b.vx -= ux; e.b.vy -= uy; }
    }
    for (const n of nodes) {
      if (n === drag) continue;
      n.vx += -n.x * .0015; n.vy += -n.y * .0021;
      n.x += n.vx; n.y += n.vy;
    }
  }

  function draw() {
    step();
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W/2 + pan.x, H/2 + pan.y);
    ctx.scale(scale, scale);
    const hovSet = hover ? neighbors[hover.id] : null;
    for (const e of edges) {
      const lit = hover && (e.a === hover || e.b === hover);
      ctx.strokeStyle = lit ? "rgba(166,56,44,.55)" : "rgba(120,100,70,.13)";
      ctx.lineWidth = lit ? 1.6 : .7;
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    for (const n of nodes) {
      const meta = G_CAT[n.cat];
      const dim = hover && n !== hover && !(hovSet && hovSet.has(n.id));
      ctx.globalAlpha = dim ? .16 : 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, meta.r, 0, Math.PI*2);
      ctx.fillStyle = n.cat === "zang" ? "rgba(251,249,243,.95)" : "rgba(251,249,243,.85)";
      ctx.fill();
      ctx.lineWidth = n === hover ? 2.6 : 1.3;
      ctx.strokeStyle = meta.color;
      ctx.stroke();
      if (n === hover) { ctx.beginPath(); ctx.arc(n.x, n.y, meta.r + 5, 0, Math.PI*2); ctx.strokeStyle = "rgba(166,56,44,.35)"; ctx.lineWidth = 1.4; ctx.stroke(); }
      ctx.fillStyle = meta.color;
      ctx.font = `${meta.w} ${meta.font}px "Noto Serif SC","Songti SC",serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const label = n.cat === "zang" ? n.id : (n.id.length > 5 ? n.id.slice(0,5) : n.id);
      ctx.fillText(label, n.x, n.y + (n.cat === "zang" ? 1 : .5));
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    requestAnimationFrame(draw);
  }
  draw();

  function pick(mx, my) {
    const x = (mx - W/2 - pan.x) / scale, y = (my - H/2 - pan.y) / scale;
    let best = null, bd = Infinity;
    for (const n of nodes) {
      const d = (n.x-x)**2 + (n.y-y)**2;
      const r = G_CAT[n.cat].r + 8;
      if (d < r*r && d < bd) { best = n; bd = d; }
    }
    return best;
  }
  function showInfo(n) {
    if (!info) return;
    if (!n) { info.innerHTML = `<div style="color:var(--muted); font-size:13px">悬停节点看邻域 · 点击查看详情 · 拖拽移动 · 滚轮缩放<br><br>节点：五脏·证型·方剂·中药·症状·舌象·脉象·经络·古籍</div>`; return; }
    const links = [...neighbors[n.id]].slice(0, 12);
    info.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px">
        <div class="organ-seal" style="border-color:${G_CAT[n.cat].color}; color:${G_CAT[n.cat].color}">${n.id.slice(0,1)}</div>
        <div style="font-size:17px; letter-spacing:.14em">${n.id}</div>
      </div>
      <div style="font-size:12px; color:var(--muted); letter-spacing:.22em; margin:8px 0">${G_CAT_NAME[n.cat] || ""}</div>
      <div style="font-size:13.5px; color:var(--ink-2); line-height:1.9">${n.d}</div>
      <div style="margin-top:10px; font-size:12px; color:var(--muted); letter-spacing:.12em">关 联</div>
      <div>${links.map(l=>`<span class="tag" onclick="graphFocus('${l}')" style="cursor:pointer">${l}</span>`).join("")}</div>
      ${n.act === "syn" ? `<div style="margin-top:10px"><a href="#" onclick="graphToSyn('${n.id}');return false">→ 证型罗盘查看方案</a></div>` : ""}`;
  }
  showInfo(null);

  let pdown = false;
  canvas.addEventListener("mousemove", e => {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    if (drag) { drag.x = (mx - W/2 - pan.x)/scale; drag.y = (my - H/2 - pan.y)/scale; return; }
    const n = pick(mx, my);
    if (n !== hover) { hover = n; canvas.style.cursor = n ? "pointer" : "grab"; }
  });
  canvas.addEventListener("mousedown", e => {
    const r = canvas.getBoundingClientRect();
    const n = pick(e.clientX - r.left, e.clientY - r.top);
    if (n) { drag = n; showInfo(n); }
    else pdown = true;
    canvas.style.cursor = "grabbing";
  });
  addEventListener("mouseup", () => { drag = null; pdown = false; canvas.style.cursor = "grab"; });
  canvas.addEventListener("mousemove", e => {
    if (pdown) { pan.x += e.movementX; pan.y += e.movementY; }
  });
  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    scale = Math.min(2.2, Math.max(.40, scale * (e.deltaY > 0 ? .92 : 1.08)));
  }, { passive: false });

  window.graphFocus = id => { hover = byId[id] || null; if (hover) showInfo(hover); };
  window.graphToSyn = id => {
    const items = [...document.querySelectorAll(".syn-item")];
    const el = items.find(x => x.textContent.includes(id));
    if (el) { el.click(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
  };
}
document.addEventListener("DOMContentLoaded", () => initGraph("wgGraph", "wgInfo"));
