'use client';

import {useState, type ReactElement} from 'react';
import {toast} from 'sonner';
import {useLanguage} from '@/lib/game/i18n';
import {opsPathReadOnly} from '@/lib/game/ops';
import {RELEASE_ROOT} from '@/lib/game/release';
import {translateTerminalOutput} from '@/lib/game/terminal-translations';
import {runCommand} from '@/lib/game/engine';
import {shellPath, siblingPath} from '@/lib/game/context-actions';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {GameContextMenu} from './GameContextMenu';
import {writeGameClipboard} from './game-clipboard';
import type {GameProps} from './types';

type Operation = 'rename' | 'copy' | 'delete' | 'file' | 'folder';
export function FileContextMenu({children, path, folder = false, props, open}: {
  children: ReactElement; path: string; folder?: boolean; props: GameProps; open?: () => void;
}) {
  const language = useLanguage(), tr = (ko: string,en: string,ja: string) => ({ko,en,ja})[language];
  const [operation,setOperation] = useState<Operation | null>(null), [name,setName] = useState(''), [error,setError] = useState('');
  const parent = folder ? path : path.slice(0,path.lastIndexOf('/')) || '/';
  const labels = {
    rename:tr('이름 변경','Rename','名前を変更'), copy:tr('복사본 만들기','Duplicate','複製'),
    delete:tr('삭제','Delete','削除'), file:tr('새 파일','New file','新しいファイル'), folder:tr('새 폴더','New folder','新しいフォルダー'),
  };
  const begin = (action: Operation) => {setOperation(action);setName(action==='rename' ? path.split('/').at(-1) ?? '' : '');setError('');};
  const local = props.state.machine === 'local';
  const locked = opsPathReadOnly(path) || props.state.gameplay.career.completed.some(id => path==='/home/dev/jobs/'+id || path.startsWith('/home/dev/jobs/'+id+'/')) || (!!props.state.gameplay.career.release.published && (path===RELEASE_ROOT || path.startsWith(RELEASE_ROOT+'/')));
  const terminal = () => {
    if (!local) return;
    props.onCommand('cd '+shellPath(parent));props.onOpen('terminal');
  };
  const submit = () => {
    if (!operation || !local) return;
    const target = siblingPath(parent,name);
    if (operation !== 'delete' && !target) {setError(tr('경로 구분자 없이 올바른 이름을 입력해 주세요.','Enter a valid name without path separators.','パス区切りを含まない有効な名前を入力してください。'));return;}
    const machine = props.state.machines.local;
    if (operation !== 'delete' && target && (Object.hasOwn(machine.files,target) || machine.dirs.includes(target))) {setError(tr('같은 이름이 이미 있어요. 다른 이름을 입력해 주세요.','That name already exists. Choose another name.','同じ名前が存在します。別の名前にしてください。'));return;}
    const command = operation === 'delete' ? 'rm '+shellPath(path)
      : operation === 'rename' || operation === 'copy' ? (operation==='rename'?'mv ':'cp ')+shellPath(path)+' '+shellPath(target!)
      : (operation==='file'?'touch ':'mkdir ')+shellPath(target!);
    // Validate against the same virtual engine, including edition and delivered-file locks.
    const result = runCommand(props.state,command,props.edition);
    if (result.error) {setError(translateTerminalOutput(command,result.output,language));return;}
    props.onCommand(command);setOperation(null);
    if (operation==='file' && target) props.openFile(target);
  };
  return <><GameContextMenu actions={[
    ...(open ? [{label:tr('열기','Open','開く'),run:open}] : []),
    {label:tr('여기서 터미널 열기','Open terminal here','ここでターミナルを開く'),run:terminal,disabled:!local},
    {label:tr('경로 복사','Copy path','パスをコピー'),run:() => {void writeGameClipboard(path).catch(() => toast(tr('경로를 복사하지 못했어요.','Could not copy the path.','パスをコピーできませんでした。')));}},
    ...(folder ? (['file','folder'] as const) : (['rename','copy','delete'] as const)).map(action => ({label:labels[action],run:() => begin(action),disabled:!local || (locked && action!=='copy'),danger:action==='delete'})),
  ]}>{children}</GameContextMenu>
  <Dialog open={operation!==null} onOpenChange={value => {if (!value) setOperation(null);}}><DialogContent className="file-action-dialog" data-no-translate closeLabel={tr('닫기','Close','閉じる')}>
    <DialogTitle>{operation ? labels[operation] : ''}</DialogTitle>
    <DialogDescription>{operation==='delete' ? tr('이 가상 파일을 삭제할까요? 이 작업은 되돌릴 수 없습니다.','Delete this virtual file? This cannot be undone.','この仮想ファイルを削除しますか？元に戻せません。') : tr('게임 속 PC의 파일에만 적용됩니다.','This affects only files on the in-game PC.','ゲーム内のPCのファイルだけに適用されます。')}</DialogDescription>
    <code>{path}</code>
    {!local && <p role="alert">{tr('터미널에서 exit로 서버 연결을 종료한 뒤 시도해 주세요.','Type exit in the terminal to leave the server first.','先にターミナルでexitを入力し、サーバー接続を終了してください。')}</p>}
    <form onSubmit={event => {event.preventDefault();submit();}}>
      {operation!=='delete' && <input aria-label={tr('새 이름','New name','新しい名前')} value={name} onChange={event => {setName(event.target.value);setError('');}} maxLength={255}/>}
      {error && <p role="alert">{error}</p>}
      <div className="file-action-buttons"><button type="button" className="outline-button" onClick={() => setOperation(null)}>{tr('취소','Cancel','キャンセル')}</button><button type="submit" className="primary-button" disabled={!local}>{operation ? labels[operation] : ''}</button></div>
    </form>
  </DialogContent></Dialog></>;
}
