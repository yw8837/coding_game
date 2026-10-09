import {createRoot} from 'react-dom/client';
import GameShell from '../../components/game/GameShell';
import '../../app/globals.css';
import '../../app/repair.css';
import '../../app/desktop.css';
import '../../app/lesson.css';
import '../../app/workflow.css';
import '../../app/pc.css';
import '../../app/practice.css';
import '../../app/career.css';
import '../../app/game-art.css';
import '../../app/release.css';
import '../../app/coach.css';
import '../../app/learning.css';

const root = document.getElementById('root');
if (!root) throw new Error('Game root is missing');
createRoot(root).render(<GameShell/>);
