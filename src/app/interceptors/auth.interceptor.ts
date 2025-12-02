import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Verifica se a URL corresponde exatamente às rotas públicas
  const isPublicRoute = 
    // GET /api/events (listar eventos) - público
    (req.url.includes('/api/events') && req.method === 'GET' && !req.url.match(/\/api\/events\/\d+\//)) ||
    // POST /api/login - público
    req.url.includes('/api/login') ||
    // POST /api/users (cadastro) - público
    (req.url.includes('/api/users') && req.method === 'POST' && req.url.endsWith('/api/users'));

  // Se for rota pública, não adiciona o token
  if (isPublicRoute) {
    return next(req);
  }

  // Para rotas privadas, adiciona o token se existir
  const token = localStorage.getItem('token');
  
  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};
