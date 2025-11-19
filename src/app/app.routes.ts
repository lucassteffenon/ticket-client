import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { EventsListComponent } from './pages/events-list/events-list';
import { EventDetailComponent } from './pages/event-detail/event-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },
  { path: 'events', component: EventsListComponent },
  { path: 'events/:id', component: EventDetailComponent },
];
