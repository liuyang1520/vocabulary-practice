export interface MemoryAid {
  japanese: string;
  reading: string;
  chinese: string;
  chunks: string;
  connection: string;
  picture: string;
  illustration: string;
  imagePath?: string;
  characterCues?: { character: string; meanings: string[] }[];
  recall?: string;
  alt: string;
  example: string;
  exampleReading: string;
  exampleMeaning: string;
}

export const unit57Memory: MemoryAid[] = [
  {
    japanese: 'ごみ',
    reading: 'ごみ',
    chinese: '垃圾',
    chunks: 'ご・み',
    connection:
      'Give these two sounds one concrete meaning: rubbish. Say ごみ as you imagine putting rubbish in a bin.',
    picture: 'Picture a little pile of rubbish waiting beside the bin.',
    illustration: 'trash',
    alt: 'Discarded paper, a carton, and a wrapper beside a household rubbish bin.',
    example: 'ごみを捨てます。',
    exampleReading: 'ごみを すてます。',
    exampleMeaning: 'I throw away rubbish.',
  },
  {
    japanese: '分別',
    reading: 'ぶんべつ',
    chinese: '分类／分類',
    chunks: 'ぶん・べつ',
    connection:
      '分 suggests dividing; 別 suggests separating. Imagine dividing rubbish into separate groups. For waste sorting, learn the reading ぶんべつ.',
    picture: 'Picture hands putting paper, cans, and glass into separate bins.',
    illustration: 'sorting',
    alt: 'Hands sorting paper, a metal can, and a glass bottle into three separate bins.',
    example: 'ごみを分別します。',
    exampleReading: 'ごみを ぶんべつします。',
    exampleMeaning: 'I sort the rubbish.',
  },
  {
    japanese: '資源',
    reading: 'しげん',
    chinese: '资源／資源',
    chunks: 'し・げん',
    connection:
      'Chinese 资源／資源 gives you the meaning: resources. Attach the Japanese sound しげん to materials that can be used again.',
    picture: 'See useful material in the paper, can, and bottle.',
    illustration: 'resources',
    alt: 'Paper, an aluminum can, and a glass bottle arranged as useful resources beside a seedling.',
    example: '資源を大切にします。',
    exampleReading: 'しげんを たいせつに します。',
    exampleMeaning: 'I take care of resources.',
  },
  {
    japanese: 'リサイクル',
    reading: 'リサイクル',
    chinese: '回收再生',
    chunks: 'リ・サ・イ・ク・ル',
    connection:
      'Start with English “recycle,” then say it with the Japanese sounds リサイクル. Imagine materials going around a cycle to become useful again.',
    picture: 'Follow the recycling arrows around a can and carton.',
    illustration: 'recycling',
    alt: 'A can and carton in a circular recycling loop becoming useful material.',
    example: '紙をリサイクルします。',
    exampleReading: 'かみを リサイクルします。',
    exampleMeaning: 'I recycle paper.',
  },
  {
    japanese: '再利用',
    reading: 'さいりよう',
    chinese: '再次利用',
    chunks: 'さい・りよう',
    connection:
      '再 = again; 利用 = use. Chinese 再次利用 and English “reuse” both lead to the same scene. Keep the long よう in りよう.',
    picture: 'An empty jam jar gets another job as a pencil holder.',
    illustration: 'reuse',
    alt: 'An empty jam jar becoming a pencil holder, connected by an arrow.',
    example: '瓶を再利用します。',
    exampleReading: 'びんを さいりようします。',
    exampleMeaning: 'I reuse a glass bottle.',
  },
  {
    japanese: '減らす',
    reading: 'へらす',
    chinese: '减少／減少',
    chunks: 'へ・ら・す',
    connection:
      'Connect 減 with Chinese 减／減. Picture making a pile smaller, and say へらす for the action of reducing something.',
    picture: 'A tall pile of disposable cups shrinks to a short pile.',
    illustration: 'reduce',
    alt: 'A tall stack of disposable cups becoming a smaller stack, with a downward arrow.',
    example: 'ごみを減らします。',
    exampleReading: 'ごみを へらします。',
    exampleMeaning: 'I reduce rubbish.',
  },
  {
    japanese: '捨てる',
    reading: 'すてる',
    chinese: '丢弃／丟棄',
    chunks: 'す・て・る',
    connection:
      'Use 捨 as a visual link to Chinese 舍弃／捨棄. Imagine letting something go into a bin while saying すてる.',
    picture: 'A hand releases a paper ball into the bin.',
    illustration: 'throw-away',
    alt: 'A hand dropping a crumpled paper ball into an open rubbish bin.',
    example: 'ごみを捨てます。',
    exampleReading: 'ごみを すてます。',
    exampleMeaning: 'I throw away rubbish.',
  },
  {
    japanese: '節約',
    reading: 'せつやく',
    chinese: '节约／節約',
    chunks: 'せつ・やく',
    connection:
      'Chinese 节约／節約 already gives you the meaning. Link せつやく to turning off a tap and saving water.',
    picture: 'Turn off the tap and keep those drops from going to waste.',
    illustration: 'saving',
    alt: 'A hand turning off a dripping tap beside a small wallet to suggest saving resources.',
    example: '水を節約します。',
    exampleReading: 'みずを せつやくします。',
    exampleMeaning: 'I save water.',
  },
  {
    japanese: '無駄',
    reading: 'むだ',
    chinese: '浪费／浪費',
    chunks: 'む・だ',
    connection:
      'Use 無 (“no” or “without”) as a cue for getting no useful result. Imagine water running away unused, and say むだ.',
    picture: 'An unattended tap sends perfectly good water down the drain.',
    illustration: 'waste',
    alt: 'An unattended tap wasting water down a sink, with a worried water-drop character.',
    example: '水を無駄にしません。',
    exampleReading: 'みずを むだに しません。',
    exampleMeaning: 'I do not waste water.',
  },
  {
    japanese: '環境',
    reading: 'かんきょう',
    chinese: '环境／環境',
    chunks: 'かん・きょう',
    connection:
      'Chinese 环境／環境 gives you the meaning. Attach かんきょう to the world around you. Let きょう keep its long vowel.',
    picture: 'Hold a little world of trees, water, and homes in your hands.',
    illustration: 'environment',
    alt: 'Hands gently holding a small globe with trees, clean water, and a house.',
    example: '環境を守ります。',
    exampleReading: 'かんきょうを まもります。',
    exampleMeaning: 'I protect the environment.',
  },
  {
    japanese: '容器',
    reading: 'ようき',
    chinese: '容器',
    chunks: 'よう・き',
    connection:
      'The written word is also Chinese 容器. Imagine something that holds things inside, and pair it with ようき. Hold the よう sound a little longer.',
    picture: 'A reusable box holds a few berries inside its hollow space.',
    illustration: 'container',
    alt: 'A reusable food container with blueberries inside and its lid beside it.',
    example: '容器を洗います。',
    exampleReading: 'ようきを あらいます。',
    exampleMeaning: 'I wash the container.',
  },
  {
    japanese: '包装',
    reading: 'ほうそう',
    chinese: '包装／包裝',
    chunks: 'ほう・そう',
    connection:
      'Chinese 包装／包裝 points to wrapping. Picture the outer paper around a parcel. Both ほう and そう have a long vowel.',
    picture: 'Peel the wrapping away from a cardboard parcel.',
    illustration: 'packaging',
    alt: 'A cardboard parcel with wrapping paper and paper cushioning peeled back around it.',
    example: '包装を減らします。',
    exampleReading: 'ほうそうを へらします。',
    exampleMeaning: 'I reduce packaging.',
  },
  {
    japanese: '生ごみ',
    reading: 'なまごみ',
    chinese: '厨余垃圾／廚餘垃圾',
    chunks: 'なま・ごみ',
    connection:
      'Here 生 is なま, meaning raw or fresh. Add ごみ, rubbish: scraps from preparing or eating food.',
    picture: 'Banana peel, carrot tops, and an apple core collect in a kitchen caddy.',
    illustration: 'food-scraps',
    alt: 'Banana peel, carrot tops, an apple core, and vegetable scraps in a kitchen caddy.',
    example: '生ごみを分別します。',
    exampleReading: 'なまごみを ぶんべつします。',
    exampleMeaning: 'I separate food scraps.',
  },
  {
    japanese: '燃えるごみ',
    reading: 'もえるごみ',
    chinese: '可燃垃圾',
    chunks: 'もえる・ごみ',
    connection:
      '燃 connects with Chinese 燃烧／燃燒. 燃える means “to burn”; add ごみ to remember the category “burnable rubbish.”',
    picture: 'A flame symbol marks a little pile of used tissues and soiled paper.',
    illustration: 'burnable-trash',
    alt: 'Used tissues and soiled paper beside an orange flame pictogram for burnable rubbish.',
    example: 'これは燃えるごみです。',
    exampleReading: 'これは もえるごみです。',
    exampleMeaning: 'This is burnable rubbish.',
  },
  {
    japanese: '燃えないごみ',
    reading: 'もえないごみ',
    chinese: '不可燃垃圾',
    chunks: 'もえない・ごみ',
    connection:
      'Compare 燃えるごみ with 燃えないごみ. The ない makes the verb negative: rubbish that does not burn.',
    picture: 'A crossed-out flame sits beside a broken mug and metal spoon.',
    illustration: 'nonburnable-trash',
    alt: 'A broken ceramic mug and metal spoon beside a crossed-out flame pictogram.',
    example: 'これは燃えないごみです。',
    exampleReading: 'これは もえないごみです。',
    exampleMeaning: 'This is nonburnable rubbish.',
  },
  {
    japanese: '紙',
    reading: 'かみ',
    chinese: '纸／紙',
    chunks: 'か・み',
    connection:
      'Recognize the meaning through Chinese 纸／紙, then attach the Japanese reading かみ to the sheet in the picture.',
    picture: 'Imagine folding the corner of a clean sheet of paper.',
    illustration: 'paper',
    alt: 'Three sheets of plain paper, with one softly folded corner.',
    example: '紙を使います。',
    exampleReading: 'かみを つかいます。',
    exampleMeaning: 'I use paper.',
  },
  {
    japanese: '缶',
    reading: 'かん',
    chinese: '罐／易拉罐',
    chunks: 'か・ん',
    connection:
      'Link 缶 to Chinese 罐 and English “can.” “Can” is an approximate sound hook; listen and copy the Japanese かん.',
    picture: 'See the shiny metal and ring-pull opening of a drink can.',
    illustration: 'can',
    alt: 'An unlabeled silver aluminum drink can with a ring-pull opening.',
    example: '缶を集めます。',
    exampleReading: 'かんを あつめます。',
    exampleMeaning: 'I collect cans.',
  },
  {
    japanese: '瓶',
    reading: 'びん',
    chinese: '玻璃瓶',
    chunks: 'び・ん',
    connection:
      'Recognize Chinese 瓶 and attach the reading びん. Imagine a glass bottle near a recycling “bin” as an approximate English sound hook.',
    picture: 'Light shines through an empty green glass bottle.',
    illustration: 'glass-bottle',
    alt: 'An empty green-tinted glass bottle with translucent highlights.',
    example: '瓶を洗います。',
    exampleReading: 'びんを あらいます。',
    exampleMeaning: 'I wash the glass bottle.',
  },
  {
    japanese: 'ペットボトル',
    reading: 'ペットボトル',
    chinese: '塑料瓶／塑膠瓶',
    chunks: 'ペット・ボトル',
    connection:
      'Use English “PET bottle”: PET names the plastic. ボトル echoes “bottle.” Give the small ッ a brief stop in ペット.',
    picture: 'A clear ridged plastic water bottle has a blue screw cap.',
    illustration: 'plastic-bottle',
    alt: 'A clear ridged PET plastic bottle with a pale blue screw cap and no label.',
    example: 'ペットボトルを集めます。',
    exampleReading: 'ペットボトルを あつめます。',
    exampleMeaning: 'I collect plastic bottles.',
  },
  {
    japanese: 'ごみ袋',
    reading: 'ごみぶくろ',
    chinese: '垃圾袋',
    chunks: 'ごみ・ぶくろ',
    connection:
      'ごみ = rubbish; 袋 = bag, just like Chinese 袋. 袋 is ふくろ on its own, but becomes ぶくろ in this compound.',
    picture: 'Tie the top of a bag after putting the rubbish inside.',
    illustration: 'trash-bag',
    alt: 'A softly rounded household rubbish bag tied at the top, with paper visible inside.',
    example: 'ごみ袋を買います。',
    exampleReading: 'ごみぶくろを かいます。',
    exampleMeaning: 'I buy rubbish bags.',
  },
];
