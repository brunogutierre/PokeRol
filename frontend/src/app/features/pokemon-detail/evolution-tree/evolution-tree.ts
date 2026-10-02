import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EvolutionNode } from '../../../core/api/api.models';
import { DexNumberPipe } from '../../../shared/dex-number.pipe';

/**
 * One stage of the evolution chain and, recursively, its branches (nested ul > li).
 * The current species is outlined and marked with aria-current="page".
 */
@Component({
  selector: 'app-evolution-tree',
  imports: [RouterLink, DexNumberPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let n = node();
    <a
      class="node"
      [routerLink]="['/pokemon', n.id]"
      [attr.aria-current]="n.id === currentId() ? 'page' : null"
    >
      <img [src]="n.spriteUrl" alt="" width="72" height="72" loading="lazy" />
      <span class="name">{{ n.name }}</span>
      <span class="number">{{ n.id | dexNumber }}</span>
    </a>
    @if (n.children.length) {
      <ul class="children" [class.branched]="n.children.length > 1">
        @for (child of n.children; track child.id) {
          <li><app-evolution-tree [node]="child" [currentId]="currentId()" /></li>
        }
      </ul>
    }
  `,
  styleUrl: './evolution-tree.scss',
})
export class EvolutionTree {
  readonly node = input.required<EvolutionNode>();
  /** Species id of the Pokémon being viewed. */
  readonly currentId = input.required<number>();
}
