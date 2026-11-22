'use client';

import {useRef, type ReactElement} from 'react';
import {ContextMenu} from 'radix-ui';
import './context-menu.css';

export type GameMenuAction = {label: string; run: () => void; disabled?: boolean; danger?: boolean};

/** Portal avoids window clipping; Radix handles arrows, Escape and collision detection. */
export function GameContextMenu({children, actions, onOpen, onClose}: {
  children: ReactElement; actions: GameMenuAction[]; onOpen?: () => void; onClose?: () => void;
}) {
  const trigger = useRef<HTMLElement | null>(null);
  return <ContextMenu.Root modal={false} onOpenChange={open => {if (open) onOpen?.();}}>
    <ContextMenu.Trigger asChild onContextMenu={event => {event.stopPropagation(); trigger.current = event.currentTarget;}}
      onKeyDown={event => {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
        event.preventDefault(); event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.dispatchEvent(new MouseEvent('contextmenu', {bubbles: true, cancelable: true, clientX: rect.left + 12, clientY: rect.top + 12}));
      }}>{children}</ContextMenu.Trigger>
    <ContextMenu.Portal><ContextMenu.Content className="game-context-menu" data-no-translate collisionPadding={8}
      onContextMenu={event => event.preventDefault()}
      onCloseAutoFocus={event => {event.preventDefault(); if (onClose) onClose(); else trigger.current?.focus();}}>
      {actions.map(action => <ContextMenu.Item key={action.label} className="game-context-item" disabled={action.disabled}
        data-danger={action.danger || undefined} onSelect={action.run}>{action.label}</ContextMenu.Item>)}
    </ContextMenu.Content></ContextMenu.Portal>
  </ContextMenu.Root>;
}
