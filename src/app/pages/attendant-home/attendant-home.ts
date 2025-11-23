import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-attendant-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './attendant-home.html',
    styleUrls: ['./attendant-home.css']
})
export class AttendantHomeComponent { }
