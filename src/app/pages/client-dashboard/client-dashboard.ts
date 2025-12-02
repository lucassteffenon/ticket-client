import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EventsService } from '../../services/events.service';
import { jsPDF } from 'jspdf';

interface Enrollment {
  user_id: number;
  event_id: number;
  status: 'pending' | 'cancelled' | 'present';
  created_at: string;
  checkin_time: string | null;
  source: string;
  user_name: string;
  user_email: string;
  event?: any;
  can_generate_certificate?: boolean;
}

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-dashboard.html',
})
export class ClientDashboardComponent implements OnInit {
  user: any = null;
  enrollments: Enrollment[] = [];
  activeEnrollments: Enrollment[] = [];
  completedEnrollments: Enrollment[] = [];
  loading = true;

  constructor(
    public auth: AuthService,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.user = this.auth.currentUser;
    this.loadEnrollments();
  }

  loadEnrollments() {
    this.loading = true;
    
    this.eventsService.getMyEnrollments().subscribe({
      next: (enrollments) => {
        this.enrollments = enrollments.filter((e: any) => e.status !== 'cancelled');
        
        // Carregar detalhes dos eventos para cada enrollment
        this.loadEventDetails();
      },
      error: (err) => {
        console.error('Erro ao carregar enrollments:', err);
        this.loading = false;
      }
    });
  }

  loadEventDetails() {
    const token = localStorage.getItem('token') || '';
    
    // Carregar detalhes de cada evento
    const eventPromises = this.enrollments.map(enrollment => {
      return this.eventsService.getEvent(enrollment.event_id.toString()).toPromise();
    });

    Promise.all(eventPromises).then(events => {
      // Associar eventos aos enrollments
      this.enrollments.forEach((enrollment, index) => {
        enrollment.event = events[index];
        
        // Verificar se pode gerar certificado:
        // 1. Evento foi finalizado (finished = true)
        // 2. Status 'present' (teve check-in)
        if (enrollment.event) {
          const eventFinished = enrollment.event.finished === true;
          const hasPresence = enrollment.status === 'present';
          
          enrollment.can_generate_certificate = eventFinished && hasPresence;
        }
      });

      // Separar enrollments ativos e completados
      const now = new Date();
      
      this.activeEnrollments = this.enrollments.filter(e => {
        if (!e.event?.starts_at) return false;
        // Evento é ativo se NÃO foi finalizado E a data de início ainda não passou
        const eventDate = new Date(e.event.starts_at);
        return !e.event.finished && eventDate >= now;
      });

      this.completedEnrollments = this.enrollments.filter(e => {
        if (!e.event) return false;
        // Evento é completado se foi finalizado OU se a data de término já passou
        const eventEndDate = e.event.ends_at ? new Date(e.event.ends_at) : new Date(e.event.starts_at);
        return e.event.finished || eventEndDate < now;
      });

      this.loading = false;
    }).catch(err => {
      console.error('Erro ao carregar detalhes dos eventos:', err);
      this.loading = false;
    });
  }

generateCertificate(enrollment: Enrollment) {
  if (!enrollment.can_generate_certificate) return;

  this.eventsService.getCertificateData().subscribe({
    next: (certificates) => {
      // Filtra o certificado do evento específico
      const certData = certificates.find(cert => cert.event_id === enrollment.event_id);
      
      if (certData) {
        this.createCertificatePDF(enrollment, certData);
      } else {
        console.error('Certificado não encontrado para este evento');
        alert('Certificado não encontrado para este evento.');
      }
    },
    error: (err) => {
      console.error('Erro ao gerar certificado:', err);
      alert('Erro ao gerar certificado. Tente novamente.');
    }
  });
}

  private createCertificatePDF(enrollment: Enrollment, certData: any) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Borda decorativa
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    doc.setLineWidth(0.5);
    doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

    // Título
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('CERTIFICADO', pageWidth / 2, 40, { align: 'center' });

    // Subtítulo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('DE PARTICIPAÇÃO', pageWidth / 2, 50, { align: 'center' });

    // Linha decorativa
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(80, 55, pageWidth - 80, 55);

    // Texto "Certificamos que"
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text('Certificamos que', pageWidth / 2, 75, { align: 'center' });

    // Nome do participante
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text(this.user?.name || enrollment.user_name, pageWidth / 2, 90, { align: 'center' });

    // Texto "participou do evento"
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('participou do evento', pageWidth / 2, 105, { align: 'center' });

    // Nome do evento
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(enrollment.event?.title || 'Evento', pageWidth / 2, 120, { align: 'center' });

    // Informações do evento
    if (enrollment.event?.location || enrollment.event?.starts_at) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      let eventInfo = '';
      if (enrollment.event?.location) {
        eventInfo += `Local: ${enrollment.event.location}`;
      }
      if (enrollment.event?.starts_at) {
        const eventDate = new Date(enrollment.event.starts_at);
        if (eventInfo) eventInfo += ' | ';
        eventInfo += `Data: ${eventDate.toLocaleDateString('pt-BR')}`;
      }
      
      doc.text(eventInfo, pageWidth / 2, 130, { align: 'center' });
    }

    // Data de emissão
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    const issuedDate = new Date(certData.issued_at);
    doc.text(
      `Emitido em: ${issuedDate.toLocaleDateString('pt-BR')} às ${issuedDate.toLocaleTimeString('pt-BR')}`,
      pageWidth / 2,
      150,
      { align: 'center' }
    );

    // Hash de verificação
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Código de Verificação: ${certData.hash}`, pageWidth / 2, pageHeight - 25, { align: 'center' });

    // Assinatura (linha)
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(pageWidth / 2 - 40, pageHeight - 35, pageWidth / 2 + 40, pageHeight - 35);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('Organização do Evento', pageWidth / 2, pageHeight - 30, { align: 'center' });

    // Download
    doc.save(`certificado-${enrollment.event?.title || 'evento'}.pdf`);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'present':
        return 'Presente';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  getCertificatesCount(): number {
    return this.completedEnrollments.filter(e => e.can_generate_certificate).length;
  }
}
