import { ChatIcon, UserIcon } from '@heroicons/react/solid'
import { Contract } from 'common/contract'
import { useNumContractComments } from 'web/hooks/use-comments-supabase'
import { shortenNumber } from 'web/lib/util/formatNumber'
import { Row } from '../layout/row'
import { Action } from './contract-table-action'
import { ContractStatusLabel } from './contracts-table'
import { shortFormatNumber } from 'common/util/format'

export type ColumnFormat = {
  header: string
  content: (c: Contract) => JSX.Element
}

export const traderColumn = {
  header: 'Traders',
  content: (contract: Contract) =>
    contract.outcomeType === 'BOUNTIED_QUESTION' ? (
      <div className="text-ink-700 h-min align-top">
        <BountiedContractComments contractId={contract.id} />
      </div>
    ) : contract.outcomeType === 'POLL' ? (
      <div className="text-ink-700 h-min align-top">
        <Row className="align-center shrink-0 items-center gap-0.5">
          <UserIcon className="h-4 w-4" />
          {shortenNumber(contract.uniqueBettorCount ?? 0)}
        </Row>
      </div>
    ) : (
      <div className="text-ink-700 h-min align-top">
        <Row className="align-center mr-1 shrink-0 items-center gap-0.5 text-sm">
          Ṁ{shortFormatNumber(contract.volume)}
        </Row>
      </div>
    ),
}

export const probColumn = {
  header: 'Stat',
  content: (contract: Contract) => (
    <div className="font-semibold">
      <ContractStatusLabel
        contract={contract}
        className="block w-[3ch] text-right"
      />
    </div>
  ),
}

export const actionColumn = {
  header: 'Action',
  content: (contract: Contract) => <Action contract={contract} />,
}

function BountiedContractComments(props: { contractId: string }) {
  const { contractId } = props
  const numComments = useNumContractComments(contractId)
  return (
    <Row className="align-center shrink-0 items-center gap-0.5">
      <ChatIcon className="h-4 w-4" />
      {numComments}
    </Row>
  )
}
