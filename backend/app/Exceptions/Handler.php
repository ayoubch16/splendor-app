<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     *
     * @return void
     */
    public function register()
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     * Toutes les routes /api/* retournent du JSON avec un format uniforme :
     * { success: false, message: string, errors?: object }
     */
    public function render($request, Throwable $e)
    {
        if ($request->is('api/*') || $request->expectsJson()) {

            // Erreurs de validation (422) — champs invalides ou manquants
            if ($e instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Les données fournies sont invalides.',
                    'errors'  => $e->errors(),
                ], 422);
            }

            // Modèle Eloquent introuvable (404)
            if ($e instanceof ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ressource introuvable.',
                ], 404);
            }

            // Route inexistante (404)
            if ($e instanceof NotFoundHttpException) {
                return response()->json([
                    'success' => false,
                    'message' => 'La route demandée n\'existe pas.',
                ], 404);
            }

            // Méthode HTTP non autorisée (405)
            if ($e instanceof MethodNotAllowedHttpException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Méthode HTTP non autorisée pour cette route.',
                ], 405);
            }

            // Non authentifié (401)
            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non authentifié. Veuillez vous connecter.',
                ], 401);
            }

            // Trop de requêtes / rate limiting (429)
            if ($e instanceof ThrottleRequestsException) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trop de requêtes. Veuillez réessayer plus tard.',
                ], 429);
            }

            // Exceptions HTTP génériques (403 Forbidden, etc.)
            if ($e instanceof HttpException) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Accès refusé.',
                ], $e->getStatusCode());
            }

            // Erreur serveur inattendue (500)
            $response = [
                'success' => false,
                'message' => 'Une erreur interne est survenue. Veuillez réessayer.',
            ];

            // Détail technique uniquement en mode debug (développement)
            if (config('app.debug')) {
                $response['error'] = $e->getMessage();
                $response['trace'] = collect($e->getTrace())->take(5)->toArray();
            }

            return response()->json($response, 500);
        }

        return parent::render($request, $e);
    }
}
