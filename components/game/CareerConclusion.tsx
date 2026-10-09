'use client';
import {useEffect,useRef} from 'react';
import {ArrowRight,Check,Mail,Monitor,Rocket} from 'lucide-react';
import {useLanguage} from '@/lib/game/i18n';
import {CAREER_JOBS} from '@/lib/game/career-content';
import {evaluateRelease,releaseFiles} from '@/lib/game/release';
import {StudioScene,CharacterPortrait} from './StoryArt';
import {CampaignGoal} from './CampaignGoal';
import type {GameProps} from './types';

export function CareerConclusion({props,onMap,onRelease}:{props:GameProps;onMap:()=>void;onRelease:()=>void}) {
 const lang=useLanguage(),tr=(ko:string,en:string,ja:string)=>({ko,en,ja})[lang];
 const career=props.state.gameplay.career,published=career.release.published;
 const completed=CAREER_JOBS.filter(job=>career.completed.includes(job.id));
 const endingCount=(career.endingJobs.length?career.endingJobs:career.completed).length+3;
 const heading=useRef<HTMLHeadingElement>(null),finished=!!career.ending&&!!published;
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[finished]);
 const stories={
  community:{title:tr('동네와 함께하는 작업실','A studio for the neighborhood','まちと歩む作業場'),body:tr('처음에는 카페 메뉴 하나였는데, 이제 우리가 쓰는 도구 곳곳에 네 손이 닿았네. 도움판 주소를 이웃들에게 전했어. 누가 만든 거냐고 묻길래, 우리 말을 끝까지 들어준 사람이라고 했지. 내일 카페에 오면 네 자리 하나 비워 둘게.','It started with a café menu. Now your work is in the tools we use every day. I shared your board with the neighbors. When they asked who made it, I told them: someone who listened. There will be a seat for you at the café tomorrow.','始まりはカフェのメニューだったね。今は毎日使う道具のあちこちに、あなたの仕事がある。案内板を近所のみんなに伝えたよ。誰が作ったの、と聞かれたから、最後まで話を聞いてくれた人だよって。明日、カフェに席を空けておくね。'),sender:'지우'},
  studio:{title:tr('기준을 세운 독립 작업실','An independent studio with standards','基準を持つ独立した作業場'),body:tr('마지막 빌드를 열어 봤어. 좁은 화면도, 잘못된 주소도 그냥 넘기지 않았더라. 처음엔 명령 하나도 낯설었는데 이제는 고친 이유와 확인한 결과가 네 기록에 남아 있어. 오늘 배포한 1.0은 네 이름으로 남겨 두자. 다음 버전도 네가 만들 수 있을 거야.','I opened the final build. You checked the narrow screen and the broken address instead of leaving them for later. Those unfamiliar commands have become a record of what you fixed and why. Version 1.0 is yours. So is whatever you build next.','最後のビルドを開いたよ。小さな画面も間違ったアドレスも、そのままにしなかったね。最初は知らなかった操作が、何をなぜ直したかの記録になった。今日の1.0はあなたの作品だ。次の版も、きっと作れるよ。'),sender:'민서'},
  balanced:{title:tr('사람과 도구를 잇는 작업실','A studio connecting people and tools','人と道具をつなぐ作業場'),body:tr('도움판에서 문의를 보내 봤어. 목록에 바로 남더라. 카페 이름을 처음 고치던 날 생각나? 이제 누군가의 부탁을 듣고, 파일을 고치고, 제대로 되는지 확인해서 내놓을 수 있게 됐네. 오늘은 새 의뢰 말고 네 첫 배포를 축하하러 와. 커피는 우리가 살게.','I sent an inquiry through your board. It appeared in the list straight away. Remember fixing the café name? Now you can listen to a request, change the files, check the result and put it out into the world. Come over to celebrate your first release. Coffee is on us.','案内板から問い合わせを送ったら、すぐ一覧に残ったよ。初めてカフェの名前を直した日を覚えてる？今はお願いを聞いて、ファイルを直し、確かめてから公開できるんだね。今日は新しい依頼じゃなく、初公開のお祝いに来て。コーヒーは私たちが出すよ。'),sender:'지우'},
 };
 const story=career.ending?stories[career.ending]:null;
 const replies=completed.filter(job=>career.choices[job.id]).filter((_,index)=>index===0||index===Math.floor(completed.length/2)||index===completed.length-1);
 return <section className="career-conclusion final-conclusion" data-testid="career-conclusion" data-no-translate>
  <StudioScene upgrades={career.upgrades} ending={finished}/>
  <span className="career-section-label">{finished?tr('첫 정식 배포 · 이야기 완료','FIRST RELEASE · STORY COMPLETE','初の正式公開 · 物語クリア'):tr('마지막 편지','THE FINAL LETTER','最後の手紙')}</span>
  <h2 ref={heading} tabIndex={-1}>{finished?story!.title:tr('내 첫 버전이 세상에 나가는 날','The day your first version goes live','最初の作品を公開する日')}</h2>
  {!published?<><p>{tr('카페에서 시작한 작은 수정을 내 프로젝트의 완성으로 이어 가세요. 최종 프로젝트를 배포하면 마지막 편지가 도착합니다.','Turn the small fixes you started at the café into a project of your own. Release the final project to receive the last letter.','カフェで始めた小さな修正を、自分の作品の完成へつなげましょう。最後の作品を公開すると手紙が届きます。')}</p>{career.ending&&<p className="career-completion-note">{tr('이전 버전에서 본 결말은 보관돼 있어요. 새로 추가된 최종 프로젝트도 이어서 도전할 수 있어요.','Your ending from the earlier version is preserved. You can continue with the new final project.','以前の版で見た結末は保存されています。追加された最後の作品にも挑戦できます。')}</p>}<CampaignGoal state={props.state}/><button className="primary-button" data-testid="ending-open-release" onClick={onRelease}>{tr('최종 프로젝트 열기','Open final project','最後の作品を開く')}<ArrowRight size={16}/></button></>:<>
   <div className="final-release-record"><Rocket size={23}/><div><strong>{evaluateRelease(releaseFiles(props.state)).preview.title}</strong><span>v{published.version} · {tr('배포 완료','Released','公開済み')}</span></div><Check size={19}/></div>
   {!career.ending?<div className="final-envelope"><Mail size={32}/><h3>{tr('지우와 민서가 편지를 보냈어요.','A letter from Jiwoo and Minseo.','ジウとミンソから手紙が届きました。')}</h3><p>{tr('동네에 남긴 작업과 고객에게 보낸 답장이 마지막 이야기가 됩니다.','Your work around the neighborhood and your replies shape the final chapter.','まちに残した仕事とお客さんへの返事が、最後の物語になります。')}</p><button className="primary-button" data-testid="career-ending" onClick={()=>props.onAction({type:'career-ending'})}>{tr('마지막 편지 열기','Open the final letter','最後の手紙を開く')}<ArrowRight size={16}/></button></div>:<><article className="final-letter" data-testid="final-letter"><header><CharacterPortrait name={story!.sender}/><div><small>{tr('받는 사람 · 첫 버전을 배포한 당신에게','TO · YOU, ON YOUR FIRST RELEASE','宛先 · 最初の版を公開したあなたへ')}</small><strong>{story!.sender==='지우'?tr('지우','Jiwoo','ジウ'):tr('민서','Minseo','ミンソ')}</strong></div></header><p>{story!.body}</p><footer>{tr(`완료한 의뢰 ${endingCount}건, 그리고 당신의 첫 프로젝트 하나.`,`${endingCount} jobs, and one project of your own.`,`${endingCount}件の依頼、そして自分の作品がひとつ。`)}</footer></article><p className="career-completion-note"><Check size={16}/>{tr('이야기 완료. 배포한 파일과 결말은 저장됩니다.','Story complete. Your released files and ending are saved.','物語クリア。公開したファイルと結末は保存されます。')}</p></>}
  </>}
  <div className="final-navigation"><button className="outline-button" data-testid="ending-map" onClick={onMap}>{tr('남은 의뢰와 기록 보기','Browse optional jobs and records','残りの依頼と記録を見る')}</button><button className="outline-button" data-testid="ending-desktop" onClick={()=>props.onOpen('desktop')}><Monitor size={16}/>{tr('바탕화면으로 돌아가기','Return to the desktop','デスクトップに戻る')}</button>{published&&<button className="career-text-button" onClick={onRelease}>{tr('배포한 프로젝트 다시 보기','Revisit the released project','公開した作品を見返す')}</button>}</div>
  {finished&&<details className="final-client-records"><summary>{tr('동네에 남은 답장','Replies from the neighborhood','まちに残る返事')}</summary>{replies.map(job=><blockquote key={job.id}><strong>{job.client[lang]}</strong><p>{job.choices.find(choice=>choice.id===career.choices[job.id])!.reply[lang]}</p></blockquote>)}<dl className="career-record-totals"><div><dt>{tr('완료한 고객 의뢰','Client jobs delivered','完了した依頼')}</dt><dd>{career.completed.length+3} / 21</dd></div><div><dt>{tr('후속 의뢰로 번 크레딧','Credits earned from career jobs','仕事で得たクレジット')}</dt><dd>{completed.reduce((sum,job)=>sum+job.credits,0).toLocaleString()} cr</dd></div></dl></details>}
 </section>;
}
