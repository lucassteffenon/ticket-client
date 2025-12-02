import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { EventsListComponent } from './pages/events-list/events-list';
import { EventDetailComponent } from './pages/event-detail/event-detail';
import { ClientDashboardComponent } from './pages/client-dashboard/client-dashboard';
import { AttendantDashboardComponent } from './pages/attendant-dashboard/attendant-dashboard';
import { AttendantSalesComponent } from './pages/attendant-sales/attendant-sales';
import { AttendantFinalizeComponent } from './pages/attendant-finalize/attendant-finalize';
import { AttendantLayoutComponent } from './pages/attendant-layout/attendant-layout';
import { VerifyCertificateComponent } from './pages/verify-certificate/verify-certificate';
import { AttendantVerifyCertificateComponent } from './pages/attendant-verify-certificate/attendant-verify-certificate';
import { AuthGuard } from './guards/auth.guard';
import { ClientLayoutComponent } from './pages/client-layout/client-layout';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'verify-certificate', component: VerifyCertificateComponent },
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      { path: 'events', component: EventsListComponent },
      { path: 'events/:id', component: EventDetailComponent },
      { path: 'dashboard', component: ClientDashboardComponent, canActivate: [AuthGuard] },
    ]
  },
  {
    path: 'attendant',
    component: AttendantLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'validate', pathMatch: 'full' },
      { path: 'validate', component: AttendantDashboardComponent },
      { path: 'sales', component: AttendantSalesComponent },
      { path: 'finalize', component: AttendantFinalizeComponent },
      { path: 'verify', component: AttendantVerifyCertificateComponent },
    ]
  },
];
