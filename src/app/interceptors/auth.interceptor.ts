import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Lista de rotas públicas que NÃO precisam de token
  const publicRoutes = [
    '/api/events',
    '/api/login',
    '/api/users',  // Rota de cadastro (POST)
  ];

  // Verifica se a URL é uma rota pública
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

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
