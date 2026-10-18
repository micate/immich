import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { init, register, waitLocale } from 'svelte-i18n';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { sdkMock } from '$lib/__mocks__/sdk.mock';
import TestWrapper from '$lib/components/TestWrapper.svelte';
import { personFactory } from '@test-data/factories/person-factory';
import MergeFaceSelector from './MergeFaceSelector.svelte';

const person = personFactory.build({ name: 'Source' });
const closest = personFactory.build({ name: 'Closest' });
const named = personFactory.build({ name: 'Known' });
const unnamed = personFactory.build({ name: '' });
const response = (people: (typeof person)[]) => ({ people, total: people.length, hidden: 0, hasNextPage: false });

const renderSelector = () =>
  render(TestWrapper, { component: MergeFaceSelector, componentProps: { person, onBack: vi.fn(), onMerge: vi.fn() } });

describe('merge people candidates', () => {
  beforeAll(async () => {
    register('en-US', () => import('$i18n/en.json'));
    await init({ fallbackLocale: 'en-US' });
    await waitLocale('en-US');
  });

  beforeEach(() => {
    vi.resetAllMocks();
    Element.prototype.animate = getAnimateMock();
  });

  it('requests similarity ranking by default and keeps the server order while excluding the source', async () => {
    sdkMock.getAllPeople.mockResolvedValue(response([person, closest, named]));
    renderSelector();
    expect(await screen.findByText('Closest')).toBeInTheDocument();
    expect(sdkMock.getAllPeople).toHaveBeenCalledWith({ withHidden: false, closestPersonId: person.id });
    expect(screen.getByRole('button', { name: 'Similar people' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('Source')).toHaveLength(1);
    expect(
      screen.getByText('Closest').compareDocumentPosition(screen.getByText('Known')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('keeps named candidates available in the known people view', async () => {
    sdkMock.getAllPeople.mockResolvedValueOnce(response([closest]));
    renderSelector();
    await screen.findByText('Closest');
    sdkMock.getAllPeople.mockResolvedValueOnce(response([unnamed, named]));
    await userEvent.click(screen.getByRole('button', { name: 'Known people' }));
    expect(await screen.findByText('Known')).toBeInTheDocument();
    expect(screen.queryByText('Closest')).not.toBeInTheDocument();
    expect(sdkMock.getAllPeople).toHaveBeenLastCalledWith({ withHidden: false, closestPersonId: undefined });
    expect(screen.getByRole('button', { name: 'Known people' })).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelectorAll('#merge-face-selector button.relative')).toHaveLength(2);
  });

  it('ignores a stale similarity response after switching views', async () => {
    let resolve!: (value: ReturnType<typeof response>) => void;
    sdkMock.getAllPeople.mockReturnValueOnce(new Promise((done) => (resolve = done)));
    renderSelector();
    sdkMock.getAllPeople.mockResolvedValueOnce(response([named]));
    await userEvent.click(screen.getByRole('button', { name: 'Known people' }));
    await screen.findByText('Known');
    resolve(response([closest]));
    await waitFor(() => expect(screen.queryByText('Closest')).not.toBeInTheDocument());
    expect(screen.getByText('Known')).toBeInTheDocument();
  });
});
