import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CaseService } from '../../../core/services/case.service';
import { Case, CaseStatus, CasePriority } from '../../../core/models';

@Component({
  selector: 'app-cases-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cases-list.component.html',
  styleUrl: './cases-list.component.scss'
})
export class CasesListComponent implements OnInit {
  private caseService = inject(CaseService);

  cases = signal<Case[]>([]);
  loading = signal(false);
  searchQuery = signal('');
  filterStatus = signal('');
  filterPriority = signal('');

  ngOnInit() {
    this.loadCases();
  }

  loadCases() {
    this.loading.set(true);
    const filters = {
      search: this.searchQuery(),
      status: this.filterStatus(),
      priority: this.filterPriority()
    };

    this.caseService.getCases(filters).subscribe({
      next: (cases) => {
        this.cases.set(cases);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading cases:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.loadCases();
  }

  onFilterChange() {
    this.loadCases();
  }
}
