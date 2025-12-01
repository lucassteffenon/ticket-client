import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { EventsListComponent } from './pages/events-list/events-list';
import { EventDetailComponent } from './pages/event-detail/event-detail';
import { AttendantDashboardComponent } from './pages/attendant-dashboard/attendant-dashboard';
import { AttendantSalesComponent } from './pages/attendant-sales/attendant-sales';
import { AttendantLayoutComponent } from './pages/attendant-layout/attendant-layout';
import { AttendantHomeComponent } from './pages/attendant-home/attendant-home';
import { AuthGuard } from './guards/auth.guard';
import { ClientLayoutComponent } from './pages/client-layout/client-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      { path: 'events', component: EventsListComponent },
      { path: 'events/:id', component: EventDetailComponent },
    ]
  },
  {
    path: 'attendant',
    component: AttendantLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: AttendantHomeComponent },
      { path: 'validate', component: AttendantDashboardComponent },
      { path: 'sales', component: AttendantSalesComponent },
    ]
  },
];
