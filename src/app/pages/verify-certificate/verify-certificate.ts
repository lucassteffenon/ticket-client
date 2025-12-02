import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EventsService } from '../../services/events.service';

@Component({
    selector: 'app-verify-certificate',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './verify-certificate.html',
})
export class VerifyCertificateComponent implements OnInit {
    verificationHash: string = '';
    verifying: boolean = false;
    verificationResult: any = null;

    constructor(private eventsService: EventsService) { }

    ngOnInit() {
        // Pode verificar se há um hash na URL (query params) para validação direta
    }

    verifyCertificate() {
        if (!this.verificationHash.trim()) {
            alert('Por favor, insira o código de verificação.');
            return;
        }

        this.verifying = true;
        this.verificationResult = null;

        this.eventsService.verifyCertificate(this.verificationHash.trim()).subscribe({
            next: (response) => {
                this.verifying = false;
                this.verificationResult = {
                    valid: true,
                    message: 'Este certificado é válido e foi emitido oficialmente.',
                    data: response
                };
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
