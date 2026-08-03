<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Services\FirebaseService;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index()
    {
        $clients = Client::all();
        return response()->json($clients);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'rfc' => 'nullable|string|max:13|unique:clients',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address_street' => 'nullable|string|max:255',
            'address_number' => 'nullable|string|max:20',
            'address_colony' => 'nullable|string|max:100',
            'address_city' => 'nullable|string|max:100',
            'address_state' => 'nullable|string|max:100',
            'address_zip_code' => 'nullable|string|max:10',
            'contact_person' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:100',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $client = Client::create([
            ...$request->all(),
            'current_balance' => 0,
            'total_purchases' => 0,
            'total_tons_purchased' => 0,
            'rating' => 0,
        ]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->createClient($client->toArray());
        }

        return response()->json($client, 201);
    }

    public function show(Client $client)
    {
        return response()->json($client);
    }

    public function update(Request $request, Client $client)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'company' => 'nullable|string|max:255',
            'rfc' => 'nullable|string|max:13|unique:clients,rfc,' . $client->id,
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address_street' => 'nullable|string|max:255',
            'address_number' => 'nullable|string|max:20',
            'address_colony' => 'nullable|string|max:100',
            'address_city' => 'nullable|string|max:100',
            'address_state' => 'nullable|string|max:100',
            'address_zip_code' => 'nullable|string|max:10',
            'contact_person' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:100',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $client->update($request->all());

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateClient($client->id, $client->toArray());
        }

        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();

        if ($this->firebase->isConfigured()) {
            $this->firebase->deleteClient($client->id);
        }

        return response()->json(['message' => 'Cliente eliminado correctamente']);
    }

    public function getPurchases(Client $client)
    {
        $purchases = $client->purchases()->orderBy('date', 'desc')->get();
        return response()->json($purchases);
    }

    public function getTrips(Client $client)
    {
        $trips = $client->trips()->with('driver', 'truck')->orderBy('scheduled_date', 'desc')->get();
        return response()->json($trips);
    }

    public function getInvoices(Client $client)
    {
        $invoices = $client->invoices()->orderBy('issue_date', 'desc')->get();
        return response()->json($invoices);
    }

    public function updateBalance(Request $request, Client $client)
    {
        $request->validate([
            'amount' => 'required|numeric',
            'type' => 'required|in:credit,debit',
        ]);

        if ($request->type === 'credit') {
            $client->current_balance -= $request->amount;
        } else {
            $client->current_balance += $request->amount;
        }

        $client->save();

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateClient($client->id, ['current_balance' => $client->current_balance]);
        }

        return response()->json($client);
    }
}
