export type LearningCategory = 'grammar' | 'verbs' | 'scenarios' | 'essentials';

export interface JapaneseExample {
  japanese: string;
  reading: string;
  meaning: string;
}

export interface LearningExercise {
  id: string;
  category: LearningCategory;
  topic: string;
  context: string;
  prompt: string;
  answer: string;
  reading?: string;
  alternatives?: string[];
  distractors: string[];
  explanation: string;
}

export interface LearningLesson {
  id: string;
  category: 'grammar' | 'essentials';
  title: string;
  subtitle: string;
  stage: 'Foundation' | 'Building blocks' | 'Next steps';
  pattern: string;
  explanation: string;
  notes: string[];
  examples: JapaneseExample[];
  tryIt: string;
  exercise: LearningExercise;
}

const example = (japanese: string, reading: string, meaning: string): JapaneseExample => ({
  japanese,
  reading,
  meaning,
});
type LessonInput = Omit<LearningLesson, 'category' | 'exercise'> & {
  quiz: [
    context: string,
    prompt: string,
    answer: string,
    distractors: string[],
    explanation: string,
  ];
};

function lesson(category: LearningLesson['category'], input: LessonInput): LearningLesson {
  const { quiz, ...content } = input;
  return {
    ...content,
    category,
    exercise: {
      id: `${category}:${input.id}`,
      category,
      topic: input.title,
      context: quiz[0],
      prompt: quiz[1],
      answer: quiz[2],
      distractors: quiz[3],
      explanation: quiz[4],
      reading: (
        {
          待って: 'まって',
          読んで: 'よんで',
          食べない: 'たべない',
          飲みたい: 'のみたい',
          食べた: 'たべた',
          勉強する: 'べんきょうする',
          帰ったら: 'かえったら',
          買った: 'かった',
          開けました: 'あけました',
          話せます: 'はなせます',
          寝た: 'ねた',
        } as Record<string, string>
      )[quiz[2]],
    },
  };
}

export const grammarLessons: LearningLesson[] = [
  lesson('grammar', {
    id: 'ability',
    title: 'Say what you can do',
    subtitle: 'Potential forms and ことができる.',
    stage: 'Building blocks',
    pattern: 'Potential verb / dictionary form + ことができます',
    explanation:
      'The potential form describes ability or the possibility of doing something. A useful alternative is a dictionary-form verb followed by ことができます. Learn the plain potential form first, then make it polite like an ichidan verb.',
    notes: [
      'Godan: 読む → 読める → 読めます. Ichidan: 食べる → 食べられる → 食べられます. する → できる. 来る → 来られる (こられる).',
      'The object of an ability often takes が, and を is also possible in many potential constructions. Standard ichidan potential forms include ら; shorter forms such as 食べれる are common in conversation.',
    ],
    examples: [
      example(
        '日本語が少し話せます。',
        'にほんごがすこしはなせます。',
        'I can speak a little Japanese.',
      ),
      example(
        'ここで切符を買うことができます。',
        'ここできっぷをかうことができます。',
        'You can buy tickets here.',
      ),
    ],
    tryIt: 'Say one thing you can do in Japanese and one skill you want to improve.',
    quiz: [
      'Use the potential of 話す to say you can speak Japanese.',
      '日本語が＿＿。',
      '話せます',
      ['話します', '話しました', '話しません'],
      '話す is godan: す → せる, then 話せる → 話せます in polite style.',
    ],
  }),
  lesson('grammar', {
    id: 'advice',
    title: 'Offer a little advice',
    subtitle: '“It would be better to…”',
    stage: 'Next steps',
    pattern: 'た-form + ほうがいい / ない-form + ほうがいい',
    explanation:
      'Use a plain past form before ほうがいい to recommend doing something. Use a plain negative form to advise against it. Although it contains a past form, the recommendation can concern a future action.',
    notes: [
      '休んだほうがいいです = You should rest. 行かないほうがいいです = It is better not to go.',
      'Direct advice can sound strong. Consider your relationship and whether advice was invited. A question such as 〜たほうがいいですか asks for advice.',
    ],
    examples: [
      example(
        '今日は早く寝たほうがいいです。',
        'きょうははやくねたほうがいいです。',
        'You should go to bed early today.',
      ),
      example(
        'ここでは写真を撮らないほうがいいです。',
        'ここではしゃしんをとらないほうがいいです。',
        'It’s better not to take photos here.',
      ),
    ],
    tryIt: 'Give yourself one useful piece of study advice, then ask for advice about tomorrow.',
    quiz: [
      'Suggest going to bed early. Use the た-form of 寝る.',
      '早く＿＿ほうがいいです。',
      '寝た',
      ['寝ます', '寝て', '寝るたい'],
      'An affirmative recommendation uses 寝た + ほうがいい.',
    ],
  }),
  lesson('grammar', {
    id: 'sentence-order',
    title: 'Build your first sentence',
    subtitle: 'Put the main idea at the end.',
    stage: 'Foundation',
    pattern: 'Topic は noun です。',
    explanation:
      'Japanese usually puts the verb or description at the end. Particles tell you how each piece fits. Start with a topic, add information, and finish with です for a polite noun sentence.',
    notes: [
      'は marks the topic and is pronounced “wa” here. です adds politeness; it is not a general replacement for every English verb.',
      'Leave out “I” or “you” when the context makes them clear. Repeating 私は in every sentence can sound heavy.',
    ],
    examples: [
      example('私は学生です。', 'わたしはがくせいです。', 'I’m a student.'),
      example('これは日本のお茶です。', 'これはにほんのおちゃです。', 'This is Japanese tea.'),
    ],
    tryIt: 'Introduce yourself with your name, then your job or role.',
    quiz: [
      'You are politely introducing yourself as a student.',
      '学生＿＿。',
      'です',
      ['ます', 'いる', 'する'],
      'A noun predicate takes です in this polite affirmative sentence. ます attaches to a verb stem.',
    ],
  }),
  lesson('grammar', {
    id: 'wa-ga',
    title: 'は and が: topic and focus',
    subtitle: 'What are we talking about? What is new?',
    stage: 'Foundation',
    pattern: 'Topic は … / subject が …',
    explanation:
      'は sets the frame or introduces a contrast. が marks the grammatical subject and often identifies the thing you are pointing out. The choice depends on what the listener already knows.',
    notes: [
      'In “Who came?”, the answer identifies the person with が: 田中さんが来ました。',
      'Do not treat は as “is” or が as “the”. Both appear in many patterns, and context can change the emphasis.',
    ],
    examples: [
      example('猫がいます。', 'ねこがいます。', 'There’s a cat.'),
      example(
        '猫はソファにいます。',
        'ねこはソファにいます。',
        'The cat is on the sofa. (Speaking of the cat…)',
      ),
    ],
    tryIt: 'Notice something in your room with が; then say where that same thing is using は.',
    quiz: [
      'Someone asks 誰が来ましたか (“Who came?”). Identify Tanaka as the person.',
      '田中さん＿＿来ました。',
      'が',
      ['を', 'で', 'に'],
      'が identifies the person who came, answering the 誰が question.',
    ],
  }),
  lesson('grammar', {
    id: 'object',
    title: 'を: what the action acts on',
    subtitle: 'Read a book. Drink some tea.',
    stage: 'Foundation',
    pattern: 'Noun を verb',
    explanation:
      'を marks the direct object of many action verbs. It is written を and usually pronounced “o”. The object normally comes before the verb.',
    notes: [
      'Learn a verb together with its particle: 本を読む, 音楽を聞く.',
      'Not every English object uses を in Japanese: 好き and common ability patterns often use が.',
    ],
    examples: [
      example(
        '毎朝、お茶を飲みます。',
        'まいあさ、おちゃをのみます。',
        'I drink tea every morning.',
      ),
      example(
        '図書館で本を読みます。',
        'としょかんでほんをよみます。',
        'I read books at the library.',
      ),
    ],
    tryIt: 'Say three things you eat, drink, read, or watch, each with を.',
    quiz: [
      'Say “I drink water.” Fill the object particle.',
      '水＿＿飲みます。',
      'を',
      ['で', 'に', 'の'],
      '水 is what you drink, so 飲む takes 水を.',
    ],
  }),
  lesson('grammar', {
    id: 'ni-de',
    title: 'に or で: place versus action',
    subtitle: 'Where something is; where something happens.',
    stage: 'Foundation',
    pattern: 'Place に あります / Place で action',
    explanation:
      'Use に for the location of existence with ある or いる. Use で for the setting of an action, such as studying or eating. に also has other jobs, including destinations and specific times.',
    notes: [
      'Use いる for people and animals; ある for inanimate things and plants in ordinary existence statements.',
      'で also marks a means: バスで (by bus), 日本語で (in Japanese).',
    ],
    examples: [
      example(
        '駅にコンビニがあります。',
        'えきにコンビニがあります。',
        'There’s a convenience store at the station.',
      ),
      example('カフェで勉強します。', 'カフェでべんきょうします。', 'I study at a café.'),
    ],
    tryIt: 'Say where you are, then where you study. Notice the particle change.',
    quiz: [
      'You study at the library. Choose the action-location particle.',
      '図書館＿＿勉強します。',
      'で',
      ['に', 'を', 'の'],
      '勉強する is an action, so its location is marked with で.',
    ],
  }),
  lesson('grammar', {
    id: 'destination',
    title: 'Destinations and travel',
    subtitle: 'Where to, how, and with whom.',
    stage: 'Foundation',
    pattern: 'Destination に / へ + transport で + 行きます',
    explanation:
      'に marks a destination, while へ highlights the direction toward it. Both often work with 行く and 来る. Use と for a companion and で for the means of transport.',
    notes: [
      'The particle へ is pronounced “e”. It is not the same as the kana’s usual “he” reading.',
      'Walking is 歩いて: 駅まで歩いて行きます. Avoid treating “on foot” like バスで.',
    ],
    examples: [
      example(
        '友達と京都に行きます。',
        'ともだちときょうとにいきます。',
        'I’m going to Kyoto with a friend.',
      ),
      example('電車で会社へ行きます。', 'でんしゃでかいしゃへいきます。', 'I go to work by train.'),
    ],
    tryIt: 'Plan a trip: choose a destination, a companion, and a way to get there.',
    quiz: [
      'You travel by train. Mark the means of transport.',
      '電車＿＿行きます。',
      'で',
      ['を', 'が', 'の'],
      'で marks the means of transport. に or へ would mark the destination.',
    ],
  }),
  lesson('grammar', {
    id: 'time',
    title: 'When and how often',
    subtitle: 'Specific times behave differently from “tomorrow”.',
    stage: 'Foundation',
    pattern: 'Specific time に / relative time + verb',
    explanation:
      'に commonly follows a specific clock time or date. Relative expressions like 今日, 明日, and 毎日 usually stand alone. Japanese nonpast forms cover both habits and future events.',
    notes: [
      '七時に = at seven. 明日 = tomorrow, usually without に.',
      'Use から and まで for a range: 九時から五時まで (from nine to five).',
    ],
    examples: [
      example(
        '毎日、七時に起きます。',
        'まいにち、しちじにおきます。',
        'I get up at seven every day.',
      ),
      example(
        '明日、友達に会います。',
        'あした、ともだちにあいます。',
        'I’ll meet a friend tomorrow.',
      ),
    ],
    tryIt: 'Describe when you wake up and one thing you will do tomorrow.',
    quiz: [
      'Say that your meeting starts at three o’clock.',
      '会議は三時＿＿始まります。',
      'に',
      ['を', 'で', 'の'],
      '三時 is a specific clock time, marked here with に.',
    ],
  }),
  lesson('grammar', {
    id: 'no-mo',
    title: 'の and も: connect and include',
    subtitle: 'My bag. A Japanese book. Me too.',
    stage: 'Foundation',
    pattern: 'Noun の noun / noun も …',
    explanation:
      'の links nouns: ownership, origin, type, and other relationships. も means “also” or “too” and often replaces は, が, or を for the part being included.',
    notes: [
      '日本語の本 can mean a book in Japanese or a book about Japanese; context decides.',
      'Some particles combine with も: 私にも (to me too), 東京でも (in Tokyo too).',
    ],
    examples: [
      example('これは私のかばんです。', 'これはわたしのかばんです。', 'This is my bag.'),
      example(
        '私も日本語を勉強しています。',
        'わたしもにほんごをべんきょうしています。',
        'I’m studying Japanese too.',
      ),
    ],
    tryIt: 'Point to something you own, then find one thing you and a friend both like.',
    quiz: [
      'Your friend likes tea. Say that you like it too.',
      '私＿＿お茶が好きです。',
      'も',
      ['の', 'を', 'に'],
      'も adds you to the people who like tea: “me too”.',
    ],
  }),
  lesson('grammar', {
    id: 'questions',
    title: 'Ask a useful question',
    subtitle: 'Use か with polite questions.',
    stage: 'Foundation',
    pattern: 'Question word + … ですか / ますか',
    explanation:
      'A polite question often ends in か. Keep normal Japanese word order and put a question word where the missing information belongs: どこ (where), いつ (when), 何 (what), 誰 (who).',
    notes: [
      'Japanese does not add an English-style “do” or invert a subject and verb.',
      'In casual speech, rising intonation often makes a question without か. Avoid adding か to every casual sentence.',
    ],
    examples: [
      example('トイレはどこですか。', 'トイレはどこですか。', 'Where is the restroom?'),
      example('何時に出発しますか。', 'なんじにしゅっぱつしますか。', 'What time will we leave?'),
    ],
    tryIt: 'Ask where the station is and what time a shop opens.',
    quiz: [
      'Ask where the station is.',
      '駅は＿＿ですか。',
      'どこ',
      ['だれ', 'いつ', 'いくら'],
      'どこ asks about a place. だれ asks who, いつ asks when, and いくら asks how much.',
    ],
  }),
  lesson('grammar', {
    id: 'adjectives',
    title: 'Two adjective families',
    subtitle: 'おいしい food; 静かな places.',
    stage: 'Building blocks',
    pattern: 'い-adjective + noun / な-adjective + な + noun',
    explanation:
      'い-adjectives attach directly to a noun. な-adjectives need な before a noun. In polite sentences, both can be followed by です, but their negative and past forms differ.',
    notes: [
      'おいしい → おいしくない → おいしかった. 静か → 静かじゃない → 静かだった (plain forms).',
      'きれい and 嫌い end in い but are な-adjectives. いい changes using よい: よくない, よかった.',
    ],
    examples: [
      example('静かなカフェが好きです。', 'しずかなカフェがすきです。', 'I like quiet cafés.'),
      example(
        'この料理はおいしかったです。',
        'このりょうりはおいしかったです。',
        'This dish was delicious.',
      ),
    ],
    tryIt: 'Describe a place you like with a な-adjective and a meal with an い-adjective.',
    quiz: [
      'Describe a quiet room. Fill the connector before the noun.',
      '静か＿＿部屋',
      'な',
      ['の', 'い', 'く'],
      '静か is a な-adjective, so it takes な directly before 部屋.',
    ],
  }),
  lesson('grammar', {
    id: 'te-requests',
    title: 'Make a request with て',
    subtitle: 'Turn an action into “please do…”.',
    stage: 'Building blocks',
    pattern: 'Verb て-form + ください',
    explanation:
      'Attach ください to the て-form to request an action. The て-form also connects actions in sequence; the final verb gives the sentence its tense and politeness.',
    notes: [
      '待つ → 待ってください. 飲む → 飲んでください. Check the verb group before changing the ending.',
      'For asking a favor, 〜てもらえますか can sound softer. ください is useful, but context and tone still matter.',
    ],
    examples: [
      example(
        'もう一度言ってください。',
        'もういちどいってください。',
        'Please say that one more time.',
      ),
      example(
        '手を洗って、ご飯を食べます。',
        'てをあらって、ごはんをたべます。',
        'I wash my hands and then eat.',
      ),
    ],
    tryIt: 'Ask someone to wait, then ask them to speak slowly.',
    quiz: [
      'Ask someone to wait. 待つ becomes which て-form?',
      '＿＿ください。',
      '待って',
      ['待いて', '待ち', '待った'],
      'Godan verbs ending in つ change to って: 待つ → 待って.',
    ],
  }),
  lesson('grammar', {
    id: 'te-iru',
    title: 'In progress or already in a state',
    subtitle: '〜ている does more than “-ing”.',
    stage: 'Building blocks',
    pattern: 'Verb て-form + います / いる',
    explanation:
      'With an action verb, ている can show an action in progress. With a change-of-state verb, it often describes the resulting state. It can also describe repeated activity or occupation.',
    notes: [
      '食べています = eating. 結婚しています = married, rather than “getting married right now”.',
      '知っています means “I know”. The usual negative is 知りません, not a mechanically formed 知っていません.',
    ],
    examples: [
      example('今、本を読んでいます。', 'いま、ほんをよんでいます。', 'I’m reading a book now.'),
      example('窓が開いています。', 'まどがあいています。', 'The window is open.'),
    ],
    tryIt: 'Describe one thing you are doing and one thing that is in a changed state.',
    quiz: [
      'You are reading right now. Complete the て-form.',
      '今、本を＿＿います。',
      '読んで',
      ['読む', '読んだ', '読みます'],
      '読む → 読んで. Adding います describes the reading in progress here.',
    ],
  }),
  lesson('grammar', {
    id: 'negative',
    title: 'Say no, and “please don’t”',
    subtitle: 'Build with the plain negative.',
    stage: 'Building blocks',
    pattern: 'Verb ない-form + でください',
    explanation:
      'Use a plain negative verb followed by でください to ask someone not to do something. The ない-form is also a useful building block in obligations and other patterns.',
    notes: [
      '食べる → 食べない; 書く → 書かない; 買う → 買わない.',
      'ある is exceptional: its plain negative is ない. する becomes しない and 来る becomes こない.',
    ],
    examples: [
      example(
        'ここで写真を撮らないでください。',
        'ここでしゃしんをとらないでください。',
        'Please don’t take photos here.',
      ),
      example('今日は出かけません。', 'きょうはでかけません。', 'I’m not going out today.'),
    ],
    tryIt: 'Make a polite “please don’t” rule for a library or museum.',
    quiz: [
      'Ask someone not to eat here. Use the plain negative of 食べる.',
      'ここで＿＿でください。',
      '食べない',
      ['食べます', '食べて', '食べた'],
      '食べる is ichidan: drop る and add ない, then でください.',
    ],
  }),
  lesson('grammar', {
    id: 'permission',
    title: 'Permission and rules',
    subtitle: 'May I? You mustn’t.',
    stage: 'Building blocks',
    pattern: 'て-form + もいいですか / て-form + はいけません',
    explanation:
      'てもいいですか asks whether an action is allowed. てはいけません says that an action is prohibited. These use the same て-form with different endings.',
    notes: [
      '座ってもいいですか = May I sit down? It asks permission, rather than whether you have the physical ability.',
      'てはいけません can sound firm. Public signs and rules often use it.',
    ],
    examples: [
      example('ここに座ってもいいですか。', 'ここにすわってもいいですか。', 'May I sit here?'),
      example(
        'ここで泳いではいけません。',
        'ここでおよいではいけません。',
        'Swimming is not allowed here.',
      ),
    ],
    tryIt: 'Ask permission to take a photo. Then invent a rule for a pool.',
    quiz: [
      'Ask permission to take a photo.',
      '写真を撮って＿＿ですか。',
      'もいい',
      ['はいけません', 'ください', 'います'],
      'てもいいですか is the pattern for asking permission.',
    ],
  }),
  lesson('grammar', {
    id: 'desire',
    title: 'Wishes and invitations',
    subtitle: 'What you want; what you suggest.',
    stage: 'Building blocks',
    pattern: 'ます-stem + たい / ませんか / ましょう',
    explanation:
      'たい attaches to a verb’s ます-stem to express wanting to do it. ませんか invites someone, and ましょう suggests doing something together.',
    notes: [
      '食べます → 食べたい. The たい ending behaves like an い-adjective: 食べたくない, 食べたかった.',
      'In statements, たい usually expresses your own wish. For another person, report what they said or use patterns such as たがっています when appropriate.',
    ],
    examples: [
      example('京都に行きたいです。', 'きょうとにいきたいです。', 'I want to go to Kyoto.'),
      example(
        '一緒に昼ご飯を食べませんか。',
        'いっしょにひるごはんをたべませんか。',
        'Would you like to have lunch together?',
      ),
    ],
    tryIt: 'Name one place you want to visit, then invite a friend to eat.',
    quiz: [
      'Say that you want to drink tea.',
      'お茶を＿＿です。',
      '飲みたい',
      ['飲むたい', '飲んでたい', '飲またい'],
      'Take the ます-stem 飲み from 飲みます and add たい.',
    ],
  }),
  lesson('grammar', {
    id: 'reason',
    title: 'Give a reason with から or ので',
    subtitle: 'Connect the reason to the result.',
    stage: 'Building blocks',
    pattern: 'Reason + から / ので + result',
    explanation:
      'から states a reason directly. ので often presents it more as background or an explanation. Neither is automatically polite or rude; the whole sentence and situation matter.',
    notes: [
      'Before ので, plain nouns and な-adjectives take な: 雨なので, 静かなので.',
      'With から, a plain noun predicate uses だ: 雨だから. Polite reasons such as 雨ですから also work.',
    ],
    examples: [
      example(
        '寒いので、窓を閉めます。',
        'さむいので、まどをしめます。',
        'It’s cold, so I’ll close the window.',
      ),
      example(
        '明日は休みだから、ゆっくり寝ます。',
        'あしたはやすみだから、ゆっくりねます。',
        'Tomorrow is a day off, so I’ll sleep in.',
      ),
    ],
    tryIt: 'Explain why you are learning Japanese using から.',
    quiz: [
      'Explain “because it’s a day off” using ので after the noun 休み.',
      '休み＿＿ので、出かけます。',
      'な',
      ['だ', 'に', 'を'],
      'A plain noun predicate takes な before ので: 休みなので.',
    ],
  }),
  lesson('grammar', {
    id: 'comparison',
    title: 'Compare and choose',
    subtitle: 'Bigger, easier, or the one you like best.',
    stage: 'Building blocks',
    pattern: 'A は B より … / A と B と、どちらが …',
    explanation:
      'より introduces the comparison baseline. のほうが highlights the preferred or more extreme choice. For a favorite within a group, use の中で … がいちばん.',
    notes: [
      'You do not add an English-style “-er” to the adjective. より supplies the comparison.',
      'どちら is useful for two alternatives; どれ is common when choosing among three or more.',
    ],
    examples: [
      example(
        '電車はバスより速いです。',
        'でんしゃはバスよりはやいです。',
        'The train is faster than the bus.',
      ),
      example(
        'お茶とコーヒーと、どちらが好きですか。',
        'おちゃとコーヒーと、どちらがすきですか。',
        'Which do you prefer, tea or coffee?',
      ),
    ],
    tryIt: 'Compare two ways to get to work, then ask someone which they prefer.',
    quiz: [
      'Say “The train is faster than the bus.”',
      '電車はバス＿＿速いです。',
      'より',
      ['まで', 'から', 'だけ'],
      'より marks the comparison baseline: compared with the bus.',
    ],
  }),
  lesson('grammar', {
    id: 'experience',
    title: 'Talk about an experience',
    subtitle: 'Have you ever…?',
    stage: 'Next steps',
    pattern: 'Verb た-form + ことがあります',
    explanation:
      'This describes having had an experience at some point before now. Use the plain past form before こと. For a specific completed event like yesterday’s dinner, use a simple past sentence instead.',
    notes: [
      '行ったことがありません = I have never been. 行きませんでした = I did not go on that occasion.',
      'A useful follow-up is いつ行きましたか (When did you go?).',
    ],
    examples: [
      example(
        '富士山に登ったことがあります。',
        'ふじさんにのぼったことがあります。',
        'I’ve climbed Mount Fuji before.',
      ),
      example(
        '納豆を食べたことがありますか。',
        'なっとうをたべたことがありますか。',
        'Have you ever eaten nattō?',
      ),
    ],
    tryIt: 'Name one food you have tried and one place you have never visited.',
    quiz: [
      'Ask whether someone has ever eaten sushi. Use the た-form.',
      '寿司を＿＿ことがありますか。',
      '食べた',
      ['食べる', '食べて', '食べます'],
      'Past plain 食べた + ことがある expresses a prior experience.',
    ],
  }),
  lesson('grammar', {
    id: 'plans',
    title: 'Make a plan, leave room for change',
    subtitle: 'An intention versus a scheduled plan.',
    stage: 'Next steps',
    pattern: 'Dictionary form + つもりです / 予定です',
    explanation:
      'つもり expresses an intention. 予定 describes a plan or schedule. Both take the dictionary form for a future action; they convey different degrees and types of commitment depending on context.',
    notes: [
      'Negative intention: 行かないつもりです (I intend not to go).',
      'A noun can take の予定: 来週の予定 (next week’s plans).',
    ],
    examples: [
      example(
        '週末、日本語を勉強するつもりです。',
        'しゅうまつ、にほんごをべんきょうするつもりです。',
        'I intend to study Japanese this weekend.',
      ),
      example(
        '来月、引っ越す予定です。',
        'らいげつ、ひっこすよていです。',
        'I’m scheduled to move next month.',
      ),
    ],
    tryIt: 'Describe a weekend intention and one event already on your calendar.',
    quiz: [
      'Say “I intend to study tomorrow.” Use the dictionary form.',
      '明日、＿＿つもりです。',
      '勉強する',
      ['勉強します', '勉強して', '勉強した'],
      'An affirmative future intention uses the dictionary form before つもり.',
    ],
  }),
  lesson('grammar', {
    id: 'tara',
    title: 'If or when: 〜たら',
    subtitle: 'Imagine a condition, then its result.',
    stage: 'Next steps',
    pattern: 'Verb た-form + ら + result',
    explanation:
      'たら expresses a condition or a “when” situation. It is useful for hypothetical plans and for an action that follows another action’s completion. The た inside this form does not by itself mean the whole event is in the past.',
    notes: [
      '行く → 行ったら. 食べる → 食べたら. Negative: 行かなかったら.',
      'ば, と, なら, and たら overlap but have different constraints. Learn them in context rather than swapping them freely.',
    ],
    examples: [
      example(
        '雨が降ったら、家にいます。',
        'あめがふったら、いえにいます。',
        'If it rains, I’ll stay home.',
      ),
      example(
        '駅に着いたら、電話してください。',
        'えきについたら、でんわしてください。',
        'Please call when you get to the station.',
      ),
    ],
    tryIt: 'Make a rainy-day plan, then say what you will do when you get home.',
    quiz: [
      'Use たら for “when I get home”. 帰る is a godan verb.',
      '家に＿＿、休みます。',
      '帰ったら',
      ['帰るたら', '帰ってら', '帰りますたら'],
      '帰る → 帰った, then add ら: 帰ったら.',
    ],
  }),
  lesson('grammar', {
    id: 'relative',
    title: 'Describe a noun with a whole idea',
    subtitle: '“The book I bought” needs no “that”.',
    stage: 'Next steps',
    pattern: 'Plain-form clause + noun',
    explanation:
      'Put the describing clause directly before the noun. Japanese does not insert a relative pronoun like “which” or “that”. The clause can describe an action, state, or habitual relationship.',
    notes: [
      'Use a plain form inside the modifier even if the sentence ends politely.',
      'Subjects inside noun-modifying clauses often take が: 友達が作った料理.',
    ],
    examples: [
      example(
        '昨日買った本を読みます。',
        'きのうかったほんをよみます。',
        'I’ll read the book I bought yesterday.',
      ),
      example(
        '日本語を話す友達がいます。',
        'にほんごをはなすともだちがいます。',
        'I have a friend who speaks Japanese.',
      ),
    ],
    tryIt: 'Describe a film you watched or a dish a friend made.',
    quiz: [
      'Say “the book I bought yesterday”. Use the plain past.',
      '昨日＿＿本',
      '買った',
      ['買いました', '買って', '買います'],
      'The plain past 買った directly modifies 本.',
    ],
  }),
  lesson('grammar', {
    id: 'obligation',
    title: 'Must do, or don’t have to',
    subtitle: 'Two negatives can create an obligation.',
    stage: 'Next steps',
    pattern: 'ない → なければなりません / なくてもいいです',
    explanation:
      'なければなりません expresses a requirement: roughly, “it won’t do if I don’t”. なくてもいい expresses a lack of obligation: it is okay not to do it.',
    notes: [
      '行かない → 行かなければなりません (must go). 行かなくてもいいです (don’t have to go).',
      '“Don’t have to” is different from “must not”. For a prohibition, use てはいけません. Casual speech often shortens obligations to なきゃ or なくちゃ.',
    ],
    examples: [
      example(
        '薬を飲まなければなりません。',
        'くすりをのまなければなりません。',
        'I have to take my medicine.',
      ),
      example(
        '明日は早く起きなくてもいいです。',
        'あしたははやくおきなくてもいいです。',
        'I don’t have to get up early tomorrow.',
      ),
    ],
    tryIt: 'Say one thing you must do today and one thing you do not have to do tomorrow.',
    quiz: [
      'You don’t have to go tomorrow. Finish the lack-of-obligation pattern.',
      '明日は行かなくても＿＿です。',
      'いい',
      ['だめ', 'ない', 'なる'],
      'なくてもいい means it is okay not to do the action.',
    ],
  }),
  lesson('grammar', {
    id: 'giving',
    title: 'Give, receive, and viewpoint',
    subtitle: 'あげる, くれる, and もらう.',
    stage: 'Next steps',
    pattern: 'Person に あげる / Person が くれる / Person に もらう',
    explanation:
      'あげる describes giving outward, くれる describes someone giving toward you or your in-group, and もらう describes receiving. The choice encodes whose viewpoint the sentence takes.',
    notes: [
      'In 友達に本をもらいました, に marks the giver. With あげる, に marks the recipient.',
      'These can attach to て-forms for favors. Social relationships matter; avoid assuming one form is suitable for everyone.',
    ],
    examples: [
      example('友達に本をあげました。', 'ともだちにほんをあげました。', 'I gave a friend a book.'),
      example('友達が本をくれました。', 'ともだちがほんをくれました。', 'A friend gave me a book.'),
    ],
    tryIt: 'Describe the same gift from the giver’s and receiver’s viewpoints.',
    quiz: [
      'A friend gave you a book. Keep the friend as subject.',
      '友達が本を＿＿。',
      'くれました',
      ['もらいました', 'いただきました', '借りました'],
      'くれる describes a gift coming toward you. もらう would make the receiver the subject.',
    ],
  }),
];

export const essentialLessons: LearningLesson[] = [
  lesson('essentials', {
    id: 'counters',
    title: 'Count things naturally',
    subtitle: 'The number changes with the thing.',
    stage: 'Foundation',
    pattern: 'Number + counter: 人 / 本 / 枚 / つ',
    explanation:
      'Japanese usually counts nouns with a counter. 人 counts people, 本 long thin objects, 枚 flat objects, and つ is a useful general counter for many things from one to nine, with とお for ten.',
    notes: [
      'People: 一人 ひとり, 二人 ふたり, 三人 さんにん, 四人 よにん. Sheets: 一枚 いちまい, 二枚 にまい.',
      'Long objects: 一本 いっぽん, 三本 さんぼん, 六本 ろっぽん. General: ひとつ, ふたつ, みっつ, よっつ, いつつ, むっつ, ななつ, やっつ, ここのつ, とお.',
    ],
    examples: [
      example('二人です。', 'ふたりです。', 'There are two of us. (At a restaurant.)'),
      example('切符を二枚ください。', 'きっぷをにまいください。', 'Two tickets, please.'),
    ],
    tryIt: 'Order two drinks with ふたつ; then ask for three tickets with 三枚.',
    quiz: [
      'At a restaurant, say that there are two people. Choose the reading.',
      '二人です。 → ＿＿です。',
      'ふたり',
      ['ににん', 'にひと', 'ふたつ'],
      '二人 has the special reading ふたり. 一人 is ひとり.',
    ],
  }),
  lesson('essentials', {
    id: 'clock',
    title: 'Tell the time',
    subtitle: 'A few readings are worth learning separately.',
    stage: 'Foundation',
    pattern: 'Hour 時 + minutes 分 / 半',
    explanation:
      'Add 時 to an hour and 分 to minutes. For half past, use 半. Put 午前 or 午後 before the time when you need to distinguish morning from afternoon or evening.',
    notes: [
      'Key hours: 四時 よじ, 七時 しちじ, 九時 くじ. 七時 may also be heard as ななじ; しちじ is the standard teaching form.',
      'Minutes: いっぷん, にふん, さんぷん, よんぷん, ごふん, ろっぷん, ななふん, はっぷん, きゅうふん, じゅっぷん (also じっぷん).',
    ],
    examples: [
      example('今、四時半です。', 'いま、よじはんです。', 'It’s half past four now.'),
      example('午後九時に帰ります。', 'ごごくじにかえります。', 'I’ll go home at nine p.m.'),
    ],
    tryIt: 'Say the current time, then the time you usually go to bed.',
    quiz: [
      'Choose the standard reading for nine o’clock.',
      '九時 → ＿＿',
      'くじ',
      ['きゅうじ', 'ここのつじ', 'きゅうふん'],
      '九時 is くじ. 九分 is きゅうふん.',
    ],
  }),
  lesson('essentials', {
    id: 'dates',
    title: 'Dates and days',
    subtitle: 'A month’s first ten days have special names.',
    stage: 'Foundation',
    pattern: 'Month 月 + date 日 / weekday 曜日',
    explanation:
      'Dates are not always read like ordinary numbers. Learn the first ten as a set, plus the 14th, 20th, and 24th. Weekdays combine a familiar character with ようび.',
    notes: [
      'Dates 1–10: ついたち, ふつか, みっか, よっか, いつか, むいか, なのか, ようか, ここのか, とおか. Also: じゅうよっか, はつか, にじゅうよっか.',
      'Weekdays: 月曜 げつよう, 火曜 かよう, 水曜 すいよう, 木曜 もくよう, 金曜 きんよう, 土曜 どよう, 日曜 にちよう. Months: 四月 しがつ, 七月 しちがつ, 九月 くがつ.',
    ],
    examples: [
      example(
        '誕生日は四月二十日です。',
        'たんじょうびはしがつはつかです。',
        'My birthday is April 20.',
      ),
      example('月曜日に会いましょう。', 'げつようびにあいましょう。', 'Let’s meet on Monday.'),
    ],
    tryIt: 'Say your birthday and the date of your next appointment.',
    quiz: [
      'Read the 20th of the month.',
      '二十日 → ＿＿',
      'はつか',
      ['にじゅうにち', 'ふつか', 'とおか'],
      'The date 二十日 has the special reading はつか.',
    ],
  }),
  lesson('essentials', {
    id: 'demonstratives',
    title: 'This, that, and over there',
    subtitle: 'The こ・そ・あ・ど family.',
    stage: 'Foundation',
    pattern: 'これ / それ / あれ / どれ',
    explanation:
      'こ points near the speaker, そ near the listener, あ away from both, and ど asks which. These families also help you point to places and describe nouns.',
    notes: [
      'Standalone things: これ, それ, あれ, どれ. Before a noun: この本, その本, あの本, どの本.',
      'Places: ここ, そこ, あそこ, どこ. In conversation, そ can also refer to something just mentioned.',
    ],
    examples: [
      example('このかばんはいくらですか。', 'このかばんはいくらですか。', 'How much is this bag?'),
      example('それをください。', 'それをください。', 'I’ll have that one, please.'),
    ],
    tryIt: 'Point to a nearby object with これ, then describe it using この + noun.',
    quiz: [
      'Point out “this book”. Choose the form directly before 本.',
      '＿＿本',
      'この',
      ['これ', 'ここ', 'どこ'],
      'この must be followed by a noun. これ stands on its own.',
    ],
  }),
  lesson('essentials', {
    id: 'politeness',
    title: 'Choose a comfortable level of politeness',
    subtitle: 'Start with です / ます in unfamiliar situations.',
    stage: 'Building blocks',
    pattern: 'Polite: です / ます ↔ plain: だ / dictionary forms',
    explanation:
      'Polite style is a useful default with staff, teachers, and people you have just met. Plain style is common among close friends and within many grammar patterns. Relationships and setting guide the choice.',
    notes: [
      'A plain verb is not automatically rude. A plain form inside a relative clause can appear in a fully polite sentence.',
      'すみません gets attention, apologizes, and sometimes acknowledges a favor. ありがとうございます expresses thanks. Use a small, clear request rather than an elaborate phrase you cannot control.',
    ],
    examples: [
      example(
        'すみません、もう一度お願いします。',
        'すみません、もういちどおねがいします。',
        'Excuse me, one more time, please.',
      ),
      example(
        '手伝ってくれてありがとう。',
        'てつだってくれてありがとう。',
        'Thanks for helping me. (To someone close.)',
      ),
    ],
    tryIt: 'Thank a shop assistant, then thank a friend. Notice the change in tone.',
    quiz: [
      'You need to get a shop assistant’s attention politely.',
      '＿＿、これはいくらですか。',
      'すみません',
      ['おやすみ', 'ただいま', 'いただきます'],
      'すみません is a natural way to get someone’s attention before a question.',
    ],
  }),
  lesson('essentials', {
    id: 'sound',
    title: 'Small sounds, big differences',
    subtitle: 'Hear long vowels, small っ, and ん.',
    stage: 'Foundation',
    pattern: 'おばさん ≠ おばあさん / きて ≠ きって',
    explanation:
      'Japanese rhythm is organized around morae, short timing units. A long vowel, small っ, and ん each take time. Hearing and producing those timing differences helps keep words distinct.',
    notes: [
      'おばさん (aunt) versus おばあさん (grandmother). A long vowel is not simply a stressed vowel.',
      'きて (come, て-form) versus きって (stamp). Small っ holds the following consonant; it is not a full “tsu”. Pitch accent varies by word and dialect; listen rather than inferring it from spelling.',
    ],
    examples: [
      example('切手をください。', 'きってをください。', 'A stamp, please.'),
      example(
        'おばあさんと話しました。',
        'おばあさんとはなしました。',
        'I spoke with my grandmother / an elderly woman.',
      ),
    ],
    tryIt: 'Listen, then tap the timing of きて (2 units) and きって (3 units).',
    quiz: [
      'Choose the spelling for “stamp”, with a held consonant.',
      'Stamp → ＿＿',
      'きって',
      ['きて', 'きいて', 'きつて'],
      '切手 is きって. The small っ adds a timing unit and holds the next consonant.',
    ],
  }),
  lesson('essentials', {
    id: 'verb-pairs',
    title: 'Did it open, or did you open it?',
    subtitle: 'Notice transitive and intransitive pairs.',
    stage: 'Building blocks',
    pattern: '窓 が 開く / 窓 を 開ける',
    explanation:
      'Some verbs describe something changing on its own, while a related verb describes someone acting on it. Learn each pair with its particle. There is no ending rule that predicts every pair.',
    notes: [
      '開く あく / 開ける あける: open / open something. 閉まる しまる / 閉める しめる: close / close something.',
      'つく / つける: turn on / turn something on. 消える きえる / 消す けす: go out / turn something off.',
    ],
    examples: [
      example('ドアが閉まりました。', 'ドアがしまりました。', 'The door closed.'),
      example('ドアを閉めました。', 'ドアをしめました。', 'I closed the door.'),
    ],
    tryIt: 'Describe a light turning on, then yourself turning the light on.',
    quiz: [
      'Say that you opened the window. Choose the verb acting on an object.',
      '窓を＿＿。',
      '開けました',
      ['開きました', '閉まりました', '消えました'],
      '開ける takes an object with を. 開く describes the window opening with が.',
    ],
  }),
  lesson('essentials', {
    id: 'repair',
    title: 'Keep a conversation going',
    subtitle: 'Ask, confirm, and buy a little thinking time.',
    stage: 'Foundation',
    pattern: 'もう一度 / ゆっくり / 〜という意味ですか',
    explanation:
      'A repair phrase lets you stay in a conversation when you miss a word. Ask for a repeat, request a slower pace, or confirm one small piece instead of abandoning the whole exchange.',
    notes: [
      'ええと… gives you thinking time. なるほど acknowledges an explanation. そうなんですね shows you are taking in new information.',
      'わかりました can sound like “understood / okay”. If you are uncertain, confirm the detail explicitly rather than saying you understand.',
    ],
    examples: [
      example(
        'もう少しゆっくり話してください。',
        'もうすこしゆっくりはなしてください。',
        'Please speak a little more slowly.',
      ),
      example(
        '「分別」はどういう意味ですか。',
        '「ぶんべつ」はどういういみですか。',
        'What does “bunbetsu” mean?',
      ),
    ],
    tryIt: 'Pretend you missed a train time. Ask for a repeat, then confirm the time.',
    quiz: [
      'Ask someone to speak slowly.',
      '＿＿話してください。',
      'ゆっくり',
      ['たくさん', 'とても', 'いつも'],
      'ゆっくり describes a slow pace. It is a useful conversation repair word.',
    ],
  }),
];

export interface LearningScenario {
  id: string;
  title: string;
  setting: string;
  goal: string;
  roles: [string, string];
  lines: (JapaneseExample & { role: 0 | 1 })[];
  notes: string[];
  mission: string;
  grammarIds: string[];
  exercise: LearningExercise;
}

function scenario(
  input: Omit<LearningScenario, 'exercise'> & {
    quiz: [
      context: string,
      prompt: string,
      answer: string,
      reading: string,
      distractors: string[],
      explanation: string,
    ];
  },
): LearningScenario {
  const { quiz, ...content } = input;
  return {
    ...content,
    exercise: {
      id: `scenarios:${input.id}`,
      category: 'scenarios',
      topic: input.title,
      context: quiz[0],
      prompt: quiz[1],
      answer: quiz[2],
      reading: quiz[3],
      distractors: quiz[4],
      explanation: quiz[5],
    },
  };
}
const line = (role: 0 | 1, japanese: string, reading: string, meaning: string) => ({
  role,
  ...example(japanese, reading, meaning),
});

export const learningScenarios: LearningScenario[] = [
  scenario({
    id: 'cafe',
    title: 'A small café order',
    setting: 'A quiet café near the station. You want an iced coffee to take away.',
    goal: 'Order, choose a size, and say whether you are staying.',
    roles: ['You', 'Staff'],
    lines: [
      line(
        1,
        'いらっしゃいませ。ご注文は？',
        'いらっしゃいませ。ごちゅうもんは？',
        'Welcome. What would you like?',
      ),
      line(
        0,
        'アイスコーヒーを一つください。',
        'アイスコーヒーをひとつください。',
        'One iced coffee, please.',
      ),
      line(
        1,
        'サイズはいかがなさいますか。',
        'サイズはいかがなさいますか。',
        'What size would you like?',
      ),
      line(
        0,
        '小さいサイズでお願いします。',
        'ちいさいサイズでおねがいします。',
        'The small size, please.',
      ),
      line(
        1,
        '店内でお召し上がりですか。',
        'てんないでおめしあがりですか。',
        'Will you be having it here?',
      ),
      line(0, '持ち帰りでお願いします。', 'もちかえりでおねがいします。', 'To go, please.'),
    ],
    notes: [
      'Staff may use honorific expressions. Recognize the intent even before you can produce those forms.',
      '一つ is a useful general counter for an order. コーヒーを一杯 also counts one cup of coffee.',
    ],
    mission: 'Switch to hot tea, order two, and choose to drink inside: 店内でお願いします。',
    grammarIds: ['object', 'adjectives'],
    quiz: [
      'The staff asks whether you are staying. You want your drink to go.',
      'What do you say?',
      '持ち帰りでお願いします。',
      'もちかえりでおねがいします。',
      ['店内でお願いします。', 'お会計をお願いします。', 'もう一度お願いします。'],
      '持ち帰り means taking an order away. 店内 means inside the shop.',
    ],
  }),
  scenario({
    id: 'station',
    title: 'Find the right train',
    setting: 'You are at a station and need to get to Kyoto without boarding the wrong train.',
    goal: 'Confirm the destination, platform, and departure time.',
    roles: ['You', 'Station staff'],
    lines: [
      line(
        0,
        'すみません、この電車は京都に行きますか。',
        'すみません、このでんしゃはきょうとにいきますか。',
        'Excuse me, does this train go to Kyoto?',
      ),
      line(
        1,
        'いいえ、京都行きは三番線です。',
        'いいえ、きょうとゆきはさんばんせんです。',
        'No, the Kyoto-bound train is on platform three.',
      ),
      line(0, '何時に出発しますか。', 'なんじにしゅっぱつしますか。', 'What time does it leave?'),
      line(1, '十時十五分です。', 'じゅうじじゅうごふんです。', 'At 10:15.'),
      line(
        0,
        '三番線ですね。ありがとうございます。',
        'さんばんせんですね。ありがとうございます。',
        'Platform three, right? Thank you.',
      ),
    ],
    notes: [
      '〜行き is “bound for …” and is read ゆき in this phrase. Listen for the destination rather than every word.',
      'Repeating a platform or time with ですね is a useful confirmation. Station announcements may use different wording.',
    ],
    mission: 'Ask about a train to Osaka, then confirm that it leaves at 11:30.',
    grammarIds: ['destination', 'time', 'questions'],
    quiz: [
      'You know the platform but need the departure time.',
      'Ask what time the train leaves.',
      '何時に出発しますか。',
      'なんじにしゅっぱつしますか。',
      ['どこで買いますか。', '何人ですか。', 'いくらですか。'],
      '何時に asks for a clock time, and 出発します means departs.',
    ],
  }),
  scenario({
    id: 'restaurant',
    title: 'Dinner with a dietary request',
    setting: 'At a small restaurant, you want to check the ingredients before you order.',
    goal: 'Ask about an ingredient and make a clear request.',
    roles: ['You', 'Staff'],
    lines: [
      line(1, '何名様ですか。', 'なんめいさまですか。', 'How many people?'),
      line(0, '二人です。', 'ふたりです。', 'Two people.'),
      line(
        0,
        'この料理に肉は入っていますか。',
        'このりょうりににくははいっていますか。',
        'Does this dish contain meat?',
      ),
      line(
        1,
        'はい、鶏肉が入っています。',
        'はい、とりにくがはいっています。',
        'Yes, it contains chicken.',
      ),
      line(
        0,
        '肉を使っていない料理はありますか。',
        'にくをつかっていないりょうりはありますか。',
        'Do you have a dish that doesn’t use meat?',
      ),
      line(
        1,
        'こちらの野菜カレーはいかがですか。',
        'こちらのやさいカレーはいかがですか。',
        'How about this vegetable curry?',
      ),
    ],
    notes: [
      '肉 often means meat, but asking about it alone does not establish whether a dish contains fish, stock, dairy, or other ingredients. Ask about each relevant ingredient.',
      'For an allergy, say the specific ingredient plus アレルギーがあります, and confirm preparation with the staff. This dialogue practices a preference, not an allergy guarantee.',
    ],
    mission:
      'Ask whether a dish contains fish using 魚 (さかな), then ask for the bill: お会計をお願いします。',
    grammarIds: ['te-iru', 'relative', 'questions'],
    quiz: [
      'Ask if a dish contains meat.',
      'Choose the ingredient question.',
      'この料理に肉は入っていますか。',
      'このりょうりににくははいっていますか。',
      ['この料理はいくらですか。', 'お会計をお願いします。', '二人です。'],
      '入っています asks about the state of containing something. いくら asks the price.',
    ],
  }),
  scenario({
    id: 'shopping',
    title: 'Find something that fits',
    setting: 'You like a shirt, but need another size and want to try it on.',
    goal: 'Ask for another size and request permission.',
    roles: ['You', 'Staff'],
    lines: [
      line(
        0,
        'すみません、これの大きいサイズはありますか。',
        'すみません、これのおおきいサイズはありますか。',
        'Excuse me, do you have this in a larger size?',
      ),
      line(
        1,
        'はい、こちらはどうですか。',
        'はい、こちらはどうですか。',
        'Yes, how about this one?',
      ),
      line(0, '試着してもいいですか。', 'しちゃくしてもいいですか。', 'May I try it on?'),
      line(
        1,
        'はい、試着室はあちらです。',
        'はい、しちゃくしつはあちらです。',
        'Yes, the fitting room is over there.',
      ),
      line(0, 'ありがとうございます。', 'ありがとうございます。', 'Thank you.'),
    ],
    notes: [
      '試着する (しちゃくする) is to try on clothing. てもいいですか asks permission.',
      'これ stands alone; この must come before a noun, as in このシャツ.',
    ],
    mission: 'Ask for a smaller size with 小さいサイズ, then ask the price.',
    grammarIds: ['permission', 'adjectives'],
    quiz: [
      'You want permission to try on a shirt.',
      'What do you ask?',
      '試着してもいいですか。',
      'しちゃくしてもいいですか。',
      ['試着してはいけません。', '試着したことがあります。', '試着しなくてもいいです。'],
      'てもいいですか asks permission; てはいけません forbids an action.',
    ],
  }),
  scenario({
    id: 'friends',
    title: 'Make a weekend plan',
    setting: 'Invite a friend to a film, suggest a time, and agree on where to meet.',
    goal: 'Invite, negotiate, and confirm.',
    roles: ['You', 'Friend'],
    lines: [
      line(
        0,
        '土曜日、一緒に映画を見ませんか。',
        'どようび、いっしょにえいがをみませんか。',
        'Would you like to see a film together on Saturday?',
      ),
      line(
        1,
        'いいですね。何時に会いましょうか。',
        'いいですね。なんじにあいましょうか。',
        'Sounds good. What time shall we meet?',
      ),
      line(0, '二時はどうですか。', 'にじはどうですか。', 'How about two?'),
      line(
        1,
        '二時はちょっと…。三時でもいいですか。',
        'にじはちょっと…。さんじでもいいですか。',
        'Two is a little difficult… Would three work?',
      ),
      line(
        0,
        'はい、駅の前で会いましょう。',
        'はい、えきのまえであいましょう。',
        'Yes, let’s meet in front of the station.',
      ),
    ],
    notes: [
      'ちょっと… with a pause can signal reluctance or a soft refusal. Listen to the unfinished thought.',
      'Friends can use polite or plain style depending on closeness. This exchange uses polite forms for a comfortable beginner pattern.',
    ],
    mission: 'Invite a friend to lunch on Sunday, and change the meeting place to a café.',
    grammarIds: ['desire', 'time', 'ni-de'],
    quiz: [
      'Invite someone to watch a film together.',
      'Choose the invitation.',
      '一緒に映画を見ませんか。',
      'いっしょにえいがをみませんか。',
      ['映画を見たことがあります。', '映画を見てはいけません。', '映画を見なくてもいいです。'],
      'ませんか is a polite invitation. It does not mean a command not to watch.',
    ],
  }),
  scenario({
    id: 'hotel',
    title: 'Check in and get oriented',
    setting: 'You have a hotel reservation and want to know the breakfast time.',
    goal: 'Introduce your reservation and ask for practical details.',
    roles: ['You', 'Reception'],
    lines: [
      line(
        0,
        'チェックインをお願いします。',
        'チェックインをおねがいします。',
        'I’d like to check in, please.',
      ),
      line(
        1,
        'ご予約のお名前をお願いします。',
        'ごよやくのおなまえをおねがいします。',
        'May I have the name on the reservation?',
      ),
      line(0, 'リーです。', 'リーです。', 'It’s Lee.'),
      line(
        1,
        '朝食は七時から九時までです。',
        'ちょうしょくはしちじからくじまでです。',
        'Breakfast is from seven to nine.',
      ),
      line(0, '朝食はどこですか。', 'ちょうしょくはどこですか。', 'Where is breakfast served?'),
      line(
        1,
        '一階のレストランです。',
        'いっかいのレストランです。',
        'In the restaurant on the first floor.',
      ),
    ],
    notes: [
      'から and まで mark the beginning and end of a time range.',
      'お名前 and ご予約 are polite staff language. You can reply simply with your own name plus です.',
    ],
    mission: 'Use your own name. Ask where the elevator is with エレベーターはどこですか。',
    grammarIds: ['time', 'questions', 'no-mo'],
    quiz: [
      'Reception says breakfast is 七時から九時まで. Identify the ending-time particle.',
      '七時から九時＿＿です。',
      'まで',
      'まで',
      ['から', 'より', 'だけ'],
      'まで marks the end of a range; から marks its beginning.',
    ],
  }),
  scenario({
    id: 'waste',
    title: 'Sort the rubbish at home',
    setting:
      'You have moved into a new apartment and are checking the local sorting rules with a neighbor.',
    goal: 'Ask which day to put things out and how to prepare them.',
    roles: ['You', 'Neighbor'],
    lines: [
      line(
        0,
        'ペットボトルは何曜日に出しますか。',
        'ペットボトルはなんようびにだしますか。',
        'What day should I put out plastic drink bottles?',
      ),
      line(1, '水曜日です。', 'すいようびです。', 'Wednesday.'),
      line(
        0,
        '出す前に、洗ったほうがいいですか。',
        'だすまえに、あらったほうがいいですか。',
        'Should I rinse them before putting them out?',
      ),
      line(
        1,
        'はい、洗って、ラベルを外してください。',
        'はい、あらって、ラベルをはずしてください。',
        'Yes, rinse them and remove the labels.',
      ),
      line(
        0,
        'わかりました。ありがとうございます。',
        'わかりました。ありがとうございます。',
        'Understood. Thank you.',
      ),
    ],
    notes: [
      'This is one practice conversation. Collection days and sorting rules vary by municipality and building; check the actual local guide.',
      '〜たほうがいい asks about advice here. 出す前に means “before putting out”. Notice how て connects the preparation steps.',
    ],
    mission:
      'Ask about cans with 缶 (かん) and paper with 紙 (かみ). Explain the two preparation steps aloud.',
    grammarIds: ['te-requests', 'questions', 'time'],
    quiz: [
      'Ask on which day of the week bottles are collected.',
      'ペットボトルは＿＿に出しますか。',
      '何曜日',
      'なんようび',
      ['何時', '何人', '何枚'],
      '何曜日 asks which weekday. The actual answer depends on the local collection schedule.',
    ],
  }),
  scenario({
    id: 'language-exchange',
    title: 'A language exchange that keeps going',
    setting: 'You are chatting with a new language partner and miss an unfamiliar word.',
    goal: 'Explain your learning, ask for help, and try again.',
    roles: ['You', 'Partner'],
    lines: [
      line(
        0,
        '日本語を勉強しています。',
        'にほんごをべんきょうしています。',
        'I’m studying Japanese.',
      ),
      line(
        1,
        'どんな練習をしていますか。',
        'どんなれんしゅうをしていますか。',
        'What kind of practice are you doing?',
      ),
      line(
        0,
        '毎日、短い文を作っています。',
        'まいにち、みじかいぶんをつくっています。',
        'I make short sentences every day.',
      ),
      line(
        0,
        'すみません、もう少しゆっくり話してください。',
        'すみません、もうすこしゆっくりはなしてください。',
        'Sorry, please speak a little more slowly.',
      ),
      line(1, 'もちろんです。', 'もちろんです。', 'Of course.'),
      line(
        0,
        '間違えたら、教えてください。',
        'まちがえたら、おしえてください。',
        'If I make a mistake, please let me know.',
      ),
    ],
    notes: [
      'A specific request like “a little more slowly” gives your partner a clear way to help.',
      '間違えたら combines a conditional with a request. You can communicate useful ideas by combining small patterns.',
    ],
    mission: 'Ask what an unfamiliar word means, then use it in a new sentence.',
    grammarIds: ['te-iru', 'te-requests', 'tara'],
    quiz: [
      'Your partner speaks too fast. Ask for a slower pace.',
      'Choose the useful repair phrase.',
      'もう少しゆっくり話してください。',
      'もうすこしゆっくりはなしてください。',
      ['何時に出発しますか。', '持ち帰りでお願いします。', '試着してもいいですか。'],
      'もう少しゆっくり = a little more slowly. 話してください asks the person to speak.',
    ],
  }),
];

export const learningExercises = [
  ...grammarLessons.map((item) => item.exercise),
  ...essentialLessons.map((item) => item.exercise),
  ...learningScenarios.map((item) => item.exercise),
];

export const learningSources = [
  {
    label: 'Japan Foundation · Irodori Starter',
    url: 'https://www.irodori.jpf.go.jp/en/starter/pdf.html',
  },
  {
    label: 'Japan Foundation · Irodori Elementary 1',
    url: 'https://www.irodori.jpf.go.jp/en/elementary01/pdf.html',
  },
  {
    label: 'Japan Foundation · Irodori Elementary 2',
    url: 'https://www.irodori.jpf.go.jp/en/elementary02/pdf.html',
  },
];
