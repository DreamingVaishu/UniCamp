import { RoleTabs } from '../../lib/tabs';

export default function Layout() {
  return <RoleTabs hidden={['form']} items={[
    ['home', 'Home', 'home'],
    ['students', 'Students', 'users'],
    ['attendance', 'Attendance', 'check-square'],
    ['results', 'Results', 'book'],
    ['channels', 'Channels', 'message-square'],
  ]} />;
}
