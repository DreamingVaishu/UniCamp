import { RoleTabs } from '../../lib/tabs';

export default function Layout() {
  return <RoleTabs items={[
    ['home', 'Home', 'home'],
    ['channels', 'Channels', 'message-square'],
    ['fees', 'Fees', 'credit-card'],
    ['results', 'Results', 'award'],
    ['profile', 'Profile', 'user'],
  ]} />;
}
