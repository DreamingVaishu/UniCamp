import { RoleTabs } from '../../lib/tabs';

export default function Layout() {
  return <RoleTabs items={[
    ['home', 'Home', 'home'],
    ['staff', 'Staff', 'users'],
    ['students', 'Students', 'user-check'],
    ['fees', 'Fees', 'credit-card'],
  ]} />;
}
