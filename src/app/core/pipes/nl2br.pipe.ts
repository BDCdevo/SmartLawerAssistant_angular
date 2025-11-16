import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe to convert newlines to <br> tags
 * Sanitizes HTML to prevent XSS attacks
 */
@Pipe({
  name: 'nl2br',
  standalone: true
})
export class Nl2brPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) {
      return '';
    }

    // Replace newlines with <br> tags
    const html = value.replace(/\n/g, '<br>');

    // Sanitize and return
    return this.sanitizer.sanitize(1, html) || '';
  }
}
