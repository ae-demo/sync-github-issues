// The app chrome every gated screen renders inside — the sample app's
// AppLayout, trimmed to what this app needs: a brand-only navbar and a
// sidebar with exactly the items specs/design/components/github-sync-webapp/
// wireframes.dsl draws on every screen ("Dashboard -> Dashboard |
// Repositories -> Repositories | Chat Destination -> ChatDestination |
// Notification Log -> NotificationLog"). ONE rail, each item wrapped in
// <Can>, so a caller holding two roles would see the union — here there is
// only one role, Administrator, which holds every grant.
import type { JSX } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Header,
  Sidebar,
  Footer,
  UserMenu,
  ColorSchemeToggle,
  Divider,
} from "@wso2/oxygen-ui";
import {
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  Bell,
  LogOut,
  User as UserIcon,
} from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { Can, useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";
import { SCREEN_ROUTES } from "../authz/screens";

const RAIL_ICONS: Record<string, JSX.Element> = {
  dashboard: <LayoutDashboard />,
  repositories: <FolderGit2 />,
  "chat-destination": <MessageSquare />,
  "notification-log": <Bell />,
};

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const { username } = useAuthz();
  const railScreens = SCREEN_ROUTES.filter((screen) => screen.inRail);
  const active = railScreens.find((screen) => pathname.startsWith(screen.path))?.key ?? railScreens[0]?.key;

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Administrator"} />
              <UserMenu.Header name={username || "Administrator"} email={username} />
              <UserMenu.Item icon={<UserIcon />} label="Signed in" onClick={() => {}} />
              <UserMenu.Divider />
              <UserMenu.Logout icon={<LogOut />} onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            <Sidebar.Category>
              {railScreens.map((screen) => (
                <Can key={screen.key} op={screen.loads!}>
                  <Sidebar.Item id={screen.key} link={<Link to={screen.path} />}>
                    <Sidebar.ItemIcon>{RAIL_ICONS[screen.key]}</Sidebar.ItemIcon>
                    <Sidebar.ItemLabel>{screen.label}</Sidebar.ItemLabel>
                  </Sidebar.Item>
                </Can>
              ))}
            </Sidebar.Category>
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© {new Date().getFullYear()} WSO2 LLC.</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
