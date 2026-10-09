'use client';
import {localizeUI} from '@/lib/game/i18n';
import {CHAPTERS} from '@/lib/game/story';
import {currentTask} from '@/lib/game/workflow';
import type {GameProps} from './types';
export function RepairDesk({state,onFollow}:GameProps){const task=currentTask(state);return localizeUI(<article className="repair-intro"><span className="eyebrow-text">의뢰서</span><h1>{CHAPTERS[state.mission].title}</h1><p>{CHAPTERS[state.mission].goal}</p><h2>{task.title}</h2><p>{task.detail}</p><button className="primary-button" onClick={onFollow}>해당 앱 열기</button></article>);}
