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
            font-size: 14px;
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
            border: 1px solid #ddd;
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
    <div class="info">
        <div class="col text-start">
            <p class="text-start">Client:  RESTAURANT AL FASSIA SARL </p>
            <p class="text-start">BOULEVARD MOHAMMED V, RÉSIDENCE ALMOHADES</p>
            <p class="text-start">ICE: 001234567000018</p>
        </div>
        <div class="col text-end">
            <p class="text-end">Devis : N°N°DEV-2025-00002</p>
            <p class="text-end">Date: DATE: 2025-06-03</p>
            
        </div>
    </div>
        <table>
        <thead>
            <tr>
                <th>Designation</th>
                <th>Quantité</th>
                <th>P.U.H.T.</th>
                <th>Credit Total</th>
            </tr>
        </thead>
        <tbody>

            <tr>
                <td>FLYERS A5 COULEUR</td>
                <td>3000</td>
                <td>0.15 DH</td>
                <td>450.00 DH</td>
            </tr>
            
            <tr>
                <td>AFFICHES A3</td>
                <td>100</td>
                <td>8.50 DH</td>
                <td>850.00 DH</td>
            </tr>

        </tbody>
    </table>

    <div class="totals">
        <div>
            <span>Total H.T.</span>
            <span>1000 DH</span>
        </div>
        @if(isset($document->tva))
        <div>
            <span>T.V.A.</span>
            <span>1000 DH</span>
        </div>
        @endif
        <div>
            <span>Total T.T.C.</span>
            <span>1000 DH</span>
        </div>
    </div>

    <div class="footer">
        <div><strong>SPLENDOR ART</strong></div>
        <div>05 Apr 1, Rue Dakar</div>
        <div>Océan-T Rabat</div>
    </div>
</body>
</html>

 -->
