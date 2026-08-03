<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'screens' => $user->allowedScreens(),
            'token' => $token,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|in:super_admin,admin,dispatcher,driver,accountant,supervisor,secretary',
            'phone' => 'nullable|string|max:20',
        ]);

        // Solo el Super Admin puede crear Admins o Super Admins.
        $actor = $request->user();
        $targetRole = $request->role;

        $actorIsSuperAdmin = $actor && $actor->role === 'super_admin';
        $actorIsAdmin = $actor && $actor->role === 'admin';
        $creatingPrivileged = in_array($targetRole, ['super_admin', 'admin']);

        if ($creatingPrivileged && !$actorIsSuperAdmin) {
            throw ValidationException::withMessages([
                'role' => ['Solo el Super Admin puede registrar Admins.'],
            ]);
        }

        // Un Admin solo puede asignar los roles permitidos.
        if ($actorIsAdmin && !in_array($targetRole, config('permissions.assignable_by_admin', []))) {
            throw ValidationException::withMessages([
                'role' => ['No puedes asignar ese rol.'],
            ]);
        }

        if (!$actor->canManageUsers()) {
            abort(403, 'No autorizado para registrar usuarios.');
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'user' => $user,
        ], 201);
    }

    /**
     * Listar usuarios (solo Super Admin / Admin).
     */
    public function users(Request $request)
    {
        if (!$request->user()->canManageUsers()) {
            abort(403, 'No autorizado.');
        }

        return response()->json(User::orderBy('name')->get());
    }

    /**
     * Actualizar rol/estado de un usuario (solo Super Admin / Admin).
     */
    public function updateUser(Request $request, User $user)
    {
        $actor = $request->user();
        if (!$actor->canManageUsers()) {
            abort(403, 'No autorizado.');
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|in:super_admin,admin,dispatcher,driver,accountant,supervisor,secretary',
            'password' => 'nullable|string|min:6',
        ]);

        // Evitar que un Admin degrade a un Super Admin.
        if ($user->role === 'super_admin' && $actor->role !== 'super_admin') {
            abort(403, 'Solo el Super Admin puede modificar a otro Super Admin.');
        }

        // Un Admin no puede asignar roles privilegiados.
        if ($actor->role === 'admin' && in_array($request->input('role'), ['super_admin', 'admin'])) {
            abort(403, 'Solo el Super Admin puede asignar ese rol.');
        }

        $data = $request->only(['name', 'phone', 'role']);
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json($user);
    }

    /**
     * Eliminar un usuario (solo Super Admin / Admin).
     */
    public function deleteUser(Request $request, User $user)
    {
        $actor = $request->user();
        if (!$actor->canManageUsers()) {
            abort(403, 'No autorizado.');
        }

        if ($user->role === 'super_admin' && $actor->role !== 'super_admin') {
            abort(403, 'Solo el Super Admin puede eliminar a otro Super Admin.');
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => $user,
            'screens' => $user->allowedScreens(),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'avatar' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $user->update($request->only(['name', 'phone', 'avatar']));

        return response()->json($user);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['La contraseña actual es incorrecta.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json(['message' => 'Contraseña actualizada correctamente']);
    }
}
