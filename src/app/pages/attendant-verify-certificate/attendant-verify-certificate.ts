import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../services/events.service';
import { UsersService } from '../../services/users.service';

@Component({
    selector: 'app-attendant-verify-certificate',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './attendant-verify-certificate.html',
})
export class AttendantVerifyCertificateComponent {
    verificationHash: string = '';
    verifying: boolean = false;
    verificationResult: any = null;

    constructor(
        private eventsService: EventsService,
        private usersService: UsersService
    ) { }

    verifyCertificate() {
        if (!this.verificationHash.trim()) {
            alert('Por favor, insira o código de verificação.');
            return;
        }

        this.verifying = true;
        this.verificationResult = null;

        this.eventsService.verifyCertificate(this.verificationHash.trim()).subscribe({
            next: (response) => {
                // Initial success with basic data
                this.verificationResult = {
                    valid: true,
                    message: 'Este certificado é válido e foi emitido oficialmente.',
                    data: response
                };

                // Fetch additional details
                if (response.event_id) {
                    this.eventsService.getEvent(response.event_id).subscribe(event => {
                        if (event) {
                            this.verificationResult.data.event_title = event.title;
                        }
                    });
                }

                if (response.user_id) {
                    this.usersService.getUser(response.user_id).subscribe(user => {
                        if (user) {
                            this.verificationResult.data.participant_name = user.name;
                        }
                    });
                }

                this.verifying = false;
            },
            error: (err) => {
                this.verifying = false;
                this.verificationResult = {
                    valid: false,
                    message: err.error?.message || 'Certificado não encontrado ou inválido.',
                    data: null
                };
            }
        });
    }

    clearVerification() {
        this.verificationHash = '';
        this.verificationResult = null;
    }
}
