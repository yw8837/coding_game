import AboutPage from '../AboutPage';
import { aboutMetadata } from '../metadata';

export const metadata = aboutMetadata('zh');
export const dynamic = 'force-static';

export default function Page() { return <AboutPage language="zh" />; }
