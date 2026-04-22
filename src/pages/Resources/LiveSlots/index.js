import React from 'react'
import Live from './Live'

export default () => {
    return <div className='w-full md:mb-2 mb-5'>
        <Live live={true} />
        <Live live={false} />
    </div>
}