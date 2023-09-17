import clsx from 'clsx'
import Link from 'next/link'
import { sortBy } from 'lodash'
import { useState } from 'react'

import { Answer } from 'common/answer'
import { CPMMMultiContract } from 'common/contract'
import { AnswersPanel } from 'web/components/answers/answers-panel'
import { Col } from 'web/components/layout/col'
import { Page } from 'web/components/layout/page'
import { Row } from 'web/components/layout/row'
import { linkClass } from 'web/components/widgets/site-link'
import { Title } from 'web/components/widgets/title'
import { useAnswersCpmm } from 'web/hooks/use-answers'
import { supabaseSearchContractsWithDefaults } from 'web/lib/firebase/api'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/outline'

export async function getStaticProps() {
  const contracts = await supabaseSearchContractsWithDefaults({
    // yc-s23
    groupId: '46258e3a-ae43-47d6-9a51-fc150a487f7e',
    // Manifold
    creatorId: 'IPTOzEqrpkWmEzh6hwvAyY9PqFb2',
  })

  return {
    props: {
      contracts,
    },
  }
}

export default function YCS23Page(props: { contracts: CPMMMultiContract[] }) {
  const { contracts } = props

  const companyProps = contracts.map((contract) => {
    const name = contract.question
      .split('Exit valuation of ')[1]
      .split(' (YC S23)?')[0]
    const valuation = getValuation(contract.answers)
    return {
      name,
      valuation,
      contract,
    }
  })
  const sortedCompanyProps = sortBy(companyProps, (c) => c.valuation).reverse()

  return (
    <Page trackPageView="YC S23">
      <Title className="px-4 py-3">YC S23</Title>
      <Col className="bg-canvas-0 max-w-3xl pb-2">
        <Row className="justify-between bg-gray-100 px-3 py-2 font-semibold">
          <div className="pl-[54px]">Company</div>
          <div className="">Valuation</div>
        </Row>
        {sortedCompanyProps.map(({ contract, name }, i) => (
          <CompanyRow
            key={contract.id}
            contract={contract}
            name={name}
            index={i + 1}
          />
        ))}
      </Col>
    </Page>
  )
}

const CompanyRow = (props: {
  contract: CPMMMultiContract
  name: string
  index: number
}) => {
  const { contract, name, index } = props

  const answers = useAnswersCpmm(contract.id) ?? contract.answers
  contract.answers = answers

  const valuation = getValuation(answers)
  const [expanded, setExpanded] = useState(false)

  return (
    <Col className="hover:bg-indigo-25 active:bg-indigo-25">
      <Link
        href={`/ManifoldMarkets/${contract.slug}`}
        key={contract.id}
        onClick={(e) => e.stopPropagation()}
      >
        <Row className="cursor-pointer select-none justify-between py-2 px-3">
          <Row className="items-baseline gap-2">
            <div
              className="self-center"
              onClick={(e) => {
                e.preventDefault()
                setExpanded((b) => !b)
              }}
            >
              {expanded ? (
                <ChevronUpIcon className="text-ink-800 h-6 w-6" />
              ) : (
                <ChevronDownIcon className="text-ink-800 h-6 w-6" />
              )}
            </div>
            <div className="min-w-[32px] text-right font-mono">{index}</div>
            <div className={clsx('text-lg', linkClass)}>{name}</div>
          </Row>
          <div className="text-lg">${valuation}M</div>
        </Row>
      </Link>
      {expanded && (
        <Col className="border-b px-3 pt-2 pb-4">
          <AnswersPanel contract={contract} />
        </Col>
      )}
    </Col>
  )
}

const getValuation = (answers: Answer[]) => {
  const probs = answers.map((a) => a.prob)
  const valuation = Math.round(
    probs[1] * logMean(10, 100) +
      probs[2] * logMean(100, 1000) +
      probs[3] * logMean(1000, 2000)
  )
  return valuation
}
const logMean = (x: number, y: number) => (y - x) / (Math.log(y) - Math.log(x))
