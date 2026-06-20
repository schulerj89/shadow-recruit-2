import './styles.css';
import { ShadowRecruitApp } from './game/App';

const host = document.querySelector<HTMLDivElement>('#app');

if (!host) {
  throw new Error('Missing #app host.');
}

const app = new ShadowRecruitApp(host);
app.start();
