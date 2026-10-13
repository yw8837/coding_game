export type EndingSceneCopy={ko:string;en:string;ja:string};
export type EndingScene={id:'neighbors'|'celebration'|'home';image:string;heading:EndingSceneCopy;body:EndingSceneCopy};
const copy=(ko:string,en:string,ja:string):EndingSceneCopy=>({ko,en,ja});
/** Describes the released product without changing a save or awarding anything. */
export function endingStoryScenes(serviceTitle:string,serviceKind?:string):EndingScene[]{
 const title=serviceTitle.trim();
 const use=serviceKind==='website'?copy('당신이 전하고 싶었던 내용을 읽으며','as they read what you wanted to share','あなたが伝えたかった内容を読みながら'):serviceKind==='webapp'?copy('당신이 만든 기능을 써보며','as they try the functions you built','あなたが作った機能を使いながら'):serviceKind==='directory'?copy('필요한 장소를 찾아보며','as they look for places they need','必要な場所を探しながら'):serviceKind==='events'?copy('다가오는 행사를 살펴보며','as they look up upcoming events','これからの催しを確かめながら'):serviceKind==='portfolio'?copy('당신이 만든 작업을 둘러보며','as they explore the work you made','あなたが作った作品を見ながら'):copy('당신이 만든 화면을 열어보며','as they open the page you made','あなたが作った画面を開きながら');
 return [
  {id:'neighbors',image:'/game-art/ending-neighbors.png',heading:copy('이제, 누군가의 하루에.','Part of someone’s day.','誰かの一日の中へ。'),body:copy(`마을 사람들이 ${use.ko} 「${title}」를 쓰기 시작했어요. 책상 위에서 고친 코드가 이제 다른 사람의 하루에 닿습니다.`,`Neighbors begin using “${title}” ${use.en}. The code you worked on at your desk is now part of someone else’s day.`,`まちの人たちは${use.ja}「${title}」を使い始めました。机で直していたコードが、誰かの一日に届いています。`)},
  {id:'celebration',image:'/game-art/ending-celebration.png',heading:copy('작은 축하가 모이는 저녁.','A small celebration that evening.','小さなお祝いが集まる夕方。'),body:copy(`지우가 따뜻한 커피를 건네고, 민서가 조용히 웃어요. “「${title}」, 네가 끝까지 만든 거잖아.” 누군가의 고맙다는 말이 오늘의 마지막 실행 결과가 됩니다.`,`Jiwoo hands you a warm coffee. Minseo smiles. “You brought ${title} all the way to release.” A quiet thank-you is the last result of your day.`,`ジウが温かいコーヒーを渡し、ミンソがそっと笑います。「${title}、最後まで作ったんだね。」誰かのありがとうが、今日の最後の実行結果になりました。`)},
  {id:'home',image:'/game-art/ending-home.png',heading:copy('다시, 내 책상 앞에서.','Back at your desk.','また、自分の机の前で。'),body:copy(`집에 돌아와 「${title}」를 한 번 더 열어봅니다. 처음엔 낯설었던 파일과 명령들이 이제 내가 만든 것을 떠올리게 해요. 오늘은 조금 뿌듯합니다. 내일은 무엇을 만들까요?`,`At home, you open “${title}” once more. The files and commands that once felt unfamiliar now remind you of something you made. You let yourself feel proud for a moment. What will you make tomorrow?`,`家に帰り、「${title}」をもう一度開きます。最初は知らなかったファイルやコマンドが、今は自分の作ったものを思い出させます。今日は少し誇らしい。明日は何を作ろう。`)},
 ];
}
