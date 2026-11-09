<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\AnomalyController;
use App\Http\Controllers\AnomalyFollowUpController;
use App\Http\Controllers\AuditPriorityController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FraudAlertStatusController;
use App\Http\Controllers\InvestigationReportController;
use App\Http\Controllers\PrioritizeAuditController;
use App\Http\Controllers\RiskMapController;
use App\Http\Controllers\WarningLetterController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/anomalies', [AnomalyController::class, 'index'])->name('anomalies.index');
    Route::get('/anomalies/create', [AnomalyController::class, 'create'])->name('anomalies.create');
    Route::post('/anomalies', [AnomalyController::class, 'store'])->name('anomalies.store');
    Route::get('/companies/{company}', [CompanyController::class, 'show'])->name('companies.show');
    Route::get('/audit-priority', [AuditPriorityController::class, 'index'])->name('audit-priority.index');
    Route::get('/risk-map', [RiskMapController::class, 'index'])->name('risk-map.index');
    Route::get('/account', [AccountController::class, 'show'])->name('account.show');

    Route::patch('/anomalies/{fraudAlert}/status', [FraudAlertStatusController::class, 'update'])
        ->name('anomalies.status.update');
    Route::post('/anomalies/{fraudAlert}/follow-ups', [AnomalyFollowUpController::class, 'store'])
        ->name('anomalies.follow-ups.store');
    Route::post('/anomalies/{fraudAlert}/prioritize-audit', [PrioritizeAuditController::class, 'store'])
        ->name('anomalies.prioritize-audit');
    Route::post('/anomalies/{fraudAlert}/warning-letter', [WarningLetterController::class, 'store'])
        ->name('anomalies.warning-letter.store');
    Route::get('/warning-letters/{warningLetter}', [WarningLetterController::class, 'show'])
        ->name('warning-letters.show');
    Route::get('/reports/{fraudAlert}', [InvestigationReportController::class, 'show'])
        ->name('reports.show');
});

require __DIR__.'/settings.php';
