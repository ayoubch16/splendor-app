<?php
// app/Http/Controllers/ArticleController.php
namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;

class ArticleController extends Controller
{
    public function index()
    {
         return response()->json(Article::orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'unite' => 'nullable|string',
            'categoryId' => 'required|numeric',
            'nameArticle' => 'required|string',
            'descriptionArticle' => 'nullable|string',  // Changé à nullable
            'priceArticle' => 'required|numeric',
        ]);

        if (isset($validated['nameArticle'])) {
            $validated['nameArticle'] = $this->sanitizeText($validated['nameArticle']);
        }
        if (isset($validated['descriptionArticle'])) {
            $validated['descriptionArticle'] = $this->sanitizeText($validated['descriptionArticle']);
        }
        if (isset($validated['unite'])) {
            $validated['unite'] = $this->sanitizeText($validated['unite']);
        }

        return Article::create($validated);
    }

    public function update(Request $request, $id)
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json(['success' => false, 'message' => 'Article non trouvé'], 404);
        }

        $validated = $request->validate([
            'unite' => 'nullable|string',
            'categoryId' => 'sometimes|required|numeric',  // Ajouté 'required' avec 'sometimes'
            'nameArticle' => 'sometimes|required|string',  // Ajouté 'required' avec 'sometimes'
            'descriptionArticle' => 'nullable|string',
            'priceArticle' => 'sometimes|required|numeric',  // Ajouté 'required' avec 'sometimes'
        ]);

        if (isset($validated['nameArticle'])) {
            $validated['nameArticle'] = $this->sanitizeText($validated['nameArticle']);
        }
        if (isset($validated['descriptionArticle'])) {
            $validated['descriptionArticle'] = $this->sanitizeText($validated['descriptionArticle']);
        }
        if (isset($validated['unite'])) {
            $validated['unite'] = $this->sanitizeText($validated['unite']);
        }

        $article->update($validated);

        return $article;
    }

    private function sanitizeText(string $value): string
    {
        // Supprimer les balises HTML/JS
        $value = strip_tags($value);
        // Décoder les entités HTML existantes (ex: &amp; → &)
        $value = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        // Supprimer les caractères de contrôle invisibles sauf tab/newline normaux
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
        // Normaliser les espaces multiples en un seul espace
        $value = preg_replace('/\s+/', ' ', $value);
        // Supprimer les espaces en début et fin
        return trim($value);
    }

    public function destroy($id)
    {
        $article = Article::find($id);

        if (!$article) {
            return response()->json([
                'success' => false,
                'message' => 'Article non trouvé.',
                'errorCode' => 'ARTICLE_NOT_FOUND'
            ], 404);
        }

        $article->delete();

        return response()->json([
            'success' => true,
            'message' => 'Article supprimé avec succès.'
        ]);
    }
}