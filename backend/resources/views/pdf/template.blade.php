<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ strtoupper($type) }} - SPLENDOR ART</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .header { margin-bottom: 20px; }
        .header img { max-width: 100%; height: auto; }
        .header-info { 
            text-align: center; 
            margin-top: 10px;
            font-size: 10px;
            color: #555;
        }
        .content { margin: 20px 0; }
        .footer { 
            font-size: 9px; 
            text-align: center;
            margin-top: 30px;
            color: #777;
        }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <!-- En-tête Splendor Art -->
    <div class="header">
        @if(file_exists($header['logo']))
            <img src="{{ $header['logo'] }}" alt="SPLENDOR ART">
        @else
            <h1 style="text-align: center; color: #333;">SPLENDOR ART</h1>
            <h2 style="text-align: center; color: #555; font-size: 14px;">The Art of Design, the Power of Impact</h2>
        @endif
        
        <div class="header-info">
            Tél: {{ $header['tel1'] }} • {{ $header['tel2'] }} • E-mail: {{ $header['email'] }}<br>
            Adresse: {{ $header['adresse'] }}<br>
            ICE: {{ $header['ice'] }} • PATIENTE: {{ $header['patente'] }} • RC: {{ $header['rc'] }} • IF: {{ $header['if'] }} • CNSS: {{ $header['cnss'] }}
        </div>
    </div>

    <!-- Contenu du document -->
    <div class="content">
        <h2 style="text-align: center; text-transform: uppercase;">{{ $type }}</h2>
        
        <!-- Vos informations de document existantes ici -->
        <!-- ... -->
    </div>

    <!-- Pied de page -->
    <div class="footer">
        SPLENDOR ART - {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>


<!-- <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.0.0/css/bootstrap.min.css" integrity="sha512-NZ19NrT58XPK5sXqXnnvtf9T5kLXSzGQlVZL9taZWeTBtXoN3xIfTdxbkQh6QSoJfJgpojRqMfhyqBAAEeiXcA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.0.0/js/bootstrap.min.js" integrity="sha512-Pv/SmxhkTB6tWGQWDa6gHgJpfBdIpyUy59QkbshS1948GRmj6WgZz18PaDMOqaEyKLRAvgil7sx/WACNGE4Txw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>

    <title>{{ ucfirst($type) }} #{{ $document->id }}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            text-transform: uppercase !important;
            font-family: Arial, sans-serif;
            font-size: 10px;
        }
        .info {
            display: flex !important;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #000;
            color: #fff;
        }
        .totals {
            margin-left: auto;
            width: 300px;
        }
        .totals div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .footer {
            margin-top: 50px;
            text-align: end;
        }
    </style>
</head>
<body>
    <div class="logo text-center my-4" style="background-color: #000; padding: 20px;">
        <img src="https://splendorart.ma/app/assets/images/logos/splendorart-logo.png" alt="Logo" class="img-fluid" style="max-width: 200px;">
    </div>

    <table>
 
        <tbody>
            <tr>
                <td style="border: none;width: 50%;" colspan="2" class="text-start"><b>Client :</b> {{ $document->client->raisonSociale }}</td>
                <td style="border: none;width: 50%;" colspan="2" class="text-end"><b>ICE:</b> {{ $document->client->ice }}</td>
            </tr>
            <tr>
                <td style="border: none;width: 50%;" colspan="2" class="text-start"><b>Adresse:</b> {{ $document->client->adresse }}</td>
                <td style="border: none;width: 50%;" colspan="2" class="text-end"><b>Date :</b> {{ $document->date }}</td>
            </tr>
        </tbody>
    </table>



<style>
    table {
        width: 100%;
        border-collapse: collapse;
    }
    th, td {
        border: 1px solid #000;
        padding: 8px;
    }
    th:first-child, td:first-child {
        width: 50%; /* Désignation plus large */
    }
</style>

@php
    $montantHT = $document->montant;
    $tvaTaux = 20;
    $tva = $montantHT * $tvaTaux / 100;
    $totalTTC = $montantHT + $tva;
@endphp

<table>
    <thead>
        <tr>
            <th>Désignation</th>
            <th class="text-center">Quantité</th>
            <th class="text-center">P.U.H.T.</th>
            <th class="text-center">Coût Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($document->articles as $article)
        <tr>
            <td>{{ $article->designation }}</td>
            <td class="text-center">{{ $article->quantite }}</td>
            <td class="text-center">{{ number_format($article->prixUnitaire, 2) }} DH</td>
            <td class="text-center">{{ number_format($article->prixTotal, 2) }} DH</td>
        </tr>
        @endforeach

        <tr>
            <td colspan="2" style="border: none;"><strong></strong></td>
            <td style="background-color: #000; color: #fff;" class="text-center"><strong>Total</strong></td>
            <td class="text-center"><strong>{{ number_format($montantHT, 2) }} DH</strong></td>
        </tr>
        <tr>
            <td colspan="2" style="border: none;"><strong></strong></td>
            <td style="background-color: #000; color: #fff;" class="text-center"><strong>T.V.A. ({{ $tvaTaux }}%)</strong></td>
            <td class="text-center"><strong>{{ number_format($tva, 2) }} DH</strong></td>
        </tr>
        <tr>
            <td colspan="2" style="border: none;"><strong></strong></td>
            <td style="background-color: #000; color: #fff;" class="text-center"><strong>Total T.T.C.</strong></td>
            <td class="text-center"><strong>{{ number_format($totalTTC, 2) }} DH</strong></td>
        </tr>
    </tbody>
</table>

@if($imprimable)
    <div class="footer text-end">
        <div><strong>SPLENDOR ART</strong></div>
        <div>05 Apr 1, Rue Dakar</div>
        <div>Océan-T Rabat</div>
    </div>
@endif
</body>
</html>
 -->
