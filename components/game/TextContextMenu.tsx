'use client';

import {useRef, useState, type ReactElement, type RefObject} from 'react';
import {toast} from 'sonner';
import {useLanguage} from '@/lib/game/i18n';
import {insertClipboard} from '@/lib/game/context-actions';
import {GameContextMenu} from './GameContextMenu';
import {readGameClipboard, writeGameClipboard} from './game-clipboard';

type Field = HTMLInputElement | HTMLTextAreaElement;
export function TextContextMenu({children, field, replace, undo, redo, clear, output = false}: {
  children: ReactElement; field: RefObject<Field | null>;
  replace: (text: string, start: number, end: number) => void;
  undo?: () => void; redo?: () => void; clear?: () => void; output?: boolean;
}) {
  const language = useLanguage(), tr = (ko: string, en: string, ja: string) => ({ko,en,ja})[language];
  const snapshot = useRef({value: '', start: 0, end: 0, selected: '', element: null as Field | null});
  const [selected, setSelected] = useState(false);
  const capture = () => {
    const element = field.current;
    const value = element?.value ?? '', start = element?.selectionStart ?? 0, end = element?.selectionEnd ?? 0;
    const selection = window.getSelection();
    // Only copy a DOM selection belonging to this terminal, not another window.
    const region = element?.closest('.terminal-body');
    const outputText = output && region && selection?.anchorNode && region.contains(selection.anchorNode) && selection.focusNode && region.contains(selection.focusNode) ? selection.toString() : '';
    snapshot.current = {value, start, end, selected: outputText || value.slice(start,end), element};
    setSelected(Boolean(snapshot.current.selected));
  };
  const current = () => snapshot.current.element?.isConnected && field.current === snapshot.current.element && field.current.value === snapshot.current.value;
  const failure = () => toast(tr('클립보드에 접근하지 못했어요. Ctrl/⌘+C 또는 V를 사용해 주세요.','Clipboard unavailable. Use Ctrl/⌘+C or V.','クリップボードを使えません。Ctrl/⌘+C または V を使ってください。'));
  const copy = async (cut = false) => {
    const saved = snapshot.current;
    try {await writeGameClipboard(saved.selected); if (cut && snapshot.current === saved && current()) replace(saved.value.slice(0,saved.start)+saved.value.slice(saved.end), saved.start, saved.start);}
    catch {failure();}
  };
  const paste = async () => {
    const saved = snapshot.current;
    try {
      const text = await readGameClipboard();
      if (snapshot.current !== saved || !current()) return;
      const result = insertClipboard(saved.value,saved.start,saved.end,text,field.current instanceof HTMLInputElement);
      if (result.text.length > 60000) {toast(tr('붙여넣기는 60,000자까지 가능합니다.','Pasted content must fit within 60,000 characters.','貼り付け後の内容は60,000文字以内にしてください。')); return;}
      replace(result.text,result.caret,result.caret);
    } catch {failure();}
  };
  return <GameContextMenu onOpen={capture} onClose={() => field.current?.focus()} actions={[
    ...(undo ? [{label:tr('실행 취소','Undo','元に戻す'),run:undo}] : []),
    ...(redo ? [{label:tr('다시 실행','Redo','やり直す'),run:redo}] : []),
    {label:tr('복사','Copy','コピー'),run:() => {void copy();},disabled:!selected},
    ...(!output ? [{label:tr('잘라내기','Cut','切り取り'),run:() => {void copy(true);},disabled:!selected}] : []),
    {label:tr('붙여넣기','Paste','貼り付け'),run:() => {void paste();}},
    {label:tr('전체 선택','Select all','すべて選択'),run:() => {field.current?.focus();field.current?.select();}},
    ...(clear ? [{label:tr('화면 지우기','Clear screen','画面を消去'),run:clear}] : []),
  ]}>{children}</GameContextMenu>;
}
