import React, { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { postUrl } from '../../../utility'
import { message, Select, Button } from 'antd'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    rectIntersection,
    useDroppable,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    rectSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Draggable Game Card Component
function DraggableGameCard({ id, gameName, thumbnail, isDragging = false }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className='w-[150px] max-w-[150px] m-3 flex flex-col overflow-hidden items-center justify-center gap-2 border border-solid border-gray-300 rounded-md cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow'
        >
            <div className='w-[150px] h-[100px] overflow-hidden flex items-center justify-center'>
                <img src={thumbnail} className='w-full' alt={gameName} />
            </div>
            <span className='text-normal text-center px-2 pb-2'>{gameName}</span>
        </div>
    )
}

// Droppable Container Component
function DroppableContainer({ id, children, label, isEmpty = false }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    })

    return (
        <div className='w-full flex flex-col gap-2'>
            <label className='font-semibold text-normal'>{label}</label>
            <div 
                ref={setNodeRef}
                className={`w-full justify-center items-center h-[calc(100vh-250px)] overflow-y-auto border-2 border-solid flex flex-wrap gap-2 rounded-lg p-2 transition-colors ${
                    isOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : isEmpty 
                            ? 'border-dashed border-gray-400 bg-gray-100' 
                            : 'border-gray-300 bg-gray-50'
                }`}
            >
                {isEmpty && !isOver && (
                    <div className='w-full h-full flex items-center justify-center text-gray-500 text-lg'>
                        Drop games here
                    </div>
                )}
                {children}
            </div>
        </div>
    )
}

export default ({ live }) => {
    const { sitemode } = useAuth()

    const [availableGames, setAvailableGames] = useState([])
    const [selectedGames, setSelectedGames] = useState([])
    const [vendorList, setVendorList] = useState([])
    const [selectedLiveVendor, setSelectedLiveVendor] = useState()
    const [activeId, setActiveId] = useState(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [originalSelectedGames, setOriginalSelectedGames] = useState([])

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    // Load vendor list on mount
    useEffect(() => {
        postUrl(sitemode, "/api/ggx/getVendorList", {}, (data) => {
            if (data.success) {
                const filteredVendors = data?.message.filter(({ type }) => live ? type === 1 : type !== 1)
                setVendorList(filteredVendors)
                if (filteredVendors.length > 0) {
                    setSelectedLiveVendor(filteredVendors[0].vendorCode)
                }
            } else {
                setVendorList([])
            }
        })
    }, [])

    // Load saved games
    useEffect(() => {
        postUrl(sitemode, "/api/ggx/getSavedList", { type: live ? 1 : 0 }, (data) => {
            setSelectedGames(data || [])
            setOriginalSelectedGames(data || [])
        })
    }, [])

    // Load available games when vendor changes
    useEffect(() => {
        if (selectedLiveVendor) {
            postUrl(sitemode, "/api/ggx/getGameList", {
                language: 'en',
                vendorCode: selectedLiveVendor
            }, (data) => {
                if (data.success) {
                    const allGames = data["message"]
                    // Filter out games that are already selected
                    const available = allGames.filter(({ gameCode, vendorCode }) =>
                        !selectedGames.some((selected) => selected.gameCode === gameCode && selected.vendorCode === vendorCode)
                    )
                    setAvailableGames(available)
                } else {
                    setAvailableGames([])
                }
            })
        }
    }, [selectedLiveVendor, selectedGames.length])

    const handleDragStart = (event) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeContainer = active.data.current?.sortable?.containerId || 'available'
        const overContainer = over.data.current?.sortable?.containerId || over.id

        // Moving from available to selected
        if (activeContainer === 'available' && overContainer === 'selected') {
            const game = availableGames.find(g => 
                `${g.gameCode}-${g.vendorCode}` === active.id
            )
            if (game) {
                setSelectedGames(prev => [...prev, game])
                setAvailableGames(prev => prev.filter(g => 
                    `${g.gameCode}-${g.vendorCode}` !== active.id
                ))
                setHasChanges(true)
            }
        }
        // Moving from selected to available
        else if (activeContainer === 'selected' && overContainer === 'available') {
            const game = selectedGames.find(g => 
                (g._id || `${g.gameCode}-${g.vendorCode}`) === active.id
            )
            if (game) {
                setAvailableGames(prev => [...prev, game])
                setSelectedGames(prev => prev.filter(g => 
                    (g._id || `${g.gameCode}-${g.vendorCode}`) !== active.id
                ))
                setHasChanges(true)
            }
        }
        // Reordering within selected
        else if (activeContainer === 'selected' && overContainer === 'selected' && active.id !== over.id) {
            setSelectedGames((items) => {
                const oldIndex = items.findIndex(item => 
                    (item._id || `${item.gameCode}-${item.vendorCode}`) === active.id
                )
                const newIndex = items.findIndex(item => 
                    (item._id || `${item.gameCode}-${item.vendorCode}`) === over.id
                )
                if (oldIndex !== -1 && newIndex !== -1) {
                    setHasChanges(true)
                    return arrayMove(items, oldIndex, newIndex)
                }
                return items
            })
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Get the current vendor type
            const currentVendorType = vendorList.find(({ vendorCode }) => vendorCode === selectedLiveVendor)?.type

            // Find games to add (in selectedGames but not in originalSelectedGames)
            const gamesToAdd = selectedGames.filter(game => 
                !originalSelectedGames.some(orig => 
                    orig.gameCode === game.gameCode && orig.vendorCode === game.vendorCode
                )
            )

            // Find games to remove (in originalSelectedGames but not in selectedGames)
            const gamesToRemove = originalSelectedGames.filter(orig =>
                !selectedGames.some(game => 
                    game.gameCode === orig.gameCode && game.vendorCode === orig.vendorCode
                )
            )

            // Check if order has changed (for games that exist in both lists)
            const hasOrderChanged = selectedGames.some((game, index) => {
                const origIndex = originalSelectedGames.findIndex(orig =>
                    orig.gameCode === game.gameCode && orig.vendorCode === game.vendorCode
                )
                return origIndex !== -1 && origIndex !== index
            })

            // If order changed, we need to remove all existing games and re-add in new order
            if (hasOrderChanged && gamesToAdd.length === 0 && gamesToRemove.length === 0) {
                // Pure reorder case: remove all and re-add in new order
                for (const game of originalSelectedGames) {
                    await new Promise((resolve, reject) => {
                        postUrl(sitemode, "/api/ggx/removeSavedList", 
                            { _id: game._id }, 
                            (data) => resolve(data)
                        )
                    })
                }
                
                // Add all games back in the new order
                for (const game of selectedGames) {
                    await new Promise((resolve, reject) => {
                        postUrl(sitemode, "/api/ggx/addSavedList", 
                            { ...game, type: currentVendorType }, 
                            (data) => {
                                if (data) resolve(data)
                                else reject()
                            }
                        )
                    })
                }
            } else {
                // Mixed case: handle additions, removals, and reordering
                // First, remove games that need to be removed
                for (const game of gamesToRemove) {
                    await new Promise((resolve, reject) => {
                        postUrl(sitemode, "/api/ggx/removeSavedList", 
                            { _id: game._id }, 
                            (data) => resolve(data)
                        )
                    })
                }

                // If order changed and we have additions/removals, remove remaining games
                if (hasOrderChanged) {
                    const remainingGames = originalSelectedGames.filter(orig =>
                        selectedGames.some(game => 
                            game.gameCode === orig.gameCode && game.vendorCode === orig.vendorCode
                        )
                    )
                    
                    for (const game of remainingGames) {
                        await new Promise((resolve, reject) => {
                            postUrl(sitemode, "/api/ggx/removeSavedList", 
                                { _id: game._id }, 
                                (data) => resolve(data)
                            )
                        })
                    }
                }

                // Add all games in the correct order
                if (hasOrderChanged) {
                    for (const game of selectedGames) {
                        await new Promise((resolve, reject) => {
                            postUrl(sitemode, "/api/ggx/addSavedList", 
                                { ...game, type: currentVendorType }, 
                                (data) => {
                                    if (data) resolve(data)
                                    else reject()
                                }
                            )
                        })
                    }
                } else {
                    // Just add new games
                    for (const game of gamesToAdd) {
                        await new Promise((resolve, reject) => {
                            postUrl(sitemode, "/api/ggx/addSavedList", 
                                { ...game, type: currentVendorType }, 
                                (data) => {
                                    if (data) resolve(data)
                                    else reject()
                                }
                            )
                        })
                    }
                }
            }

            message.success('Changes saved successfully!')
            
            // Reload saved games to get updated _id values
            postUrl(sitemode, "/api/ggx/getSavedList", { type: live ? 1 : 0 }, (data) => {
                setSelectedGames(data || [])
                setOriginalSelectedGames(data || [])
                setHasChanges(false)
            })
        } catch (error) {
            message.error('Failed to save changes')
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setSelectedGames(originalSelectedGames)
        // Recalculate available games
        postUrl(sitemode, "/api/ggx/getGameList", {
            language: 'en',
            vendorCode: selectedLiveVendor
        }, (data) => {
            if (data.success) {
                const allGames = data["message"]
                const available = allGames.filter(({ gameCode, vendorCode }) =>
                    !originalSelectedGames.some((selected) => selected.gameCode === gameCode && selected.vendorCode === vendorCode)
                )
                setAvailableGames(available)
            }
        })
        setHasChanges(false)
    }

    const activeGame = activeId 
        ? [...availableGames, ...selectedGames].find(g => 
            (g._id || `${g.gameCode}-${g.vendorCode}`) === activeId
        )
        : null

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={rectIntersection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className='w-full mt-3 px-4'>
                <div className='w-full flex flex-col gap-4'>
                    <div className='flex justify-between items-center'>
                        <label className='font-bold text-xl'>{live ? 'Live Casino Games' : 'Games'}</label>
                        <div className='flex gap-2'>
                            {hasChanges && (
                                <Button onClick={handleReset}>
                                    Reset
                                </Button>
                            )}
                            <Button 
                                type="primary" 
                                onClick={handleSave} 
                                loading={isSaving}
                                disabled={!hasChanges}
                            >
                                Save Changes
                            </Button>
                    </div>
                </div>

                    <Select 
                        value={selectedLiveVendor} 
                        onChange={(value) => setSelectedLiveVendor(value)} 
                        className='w-[300px]'
                    >
                        {vendorList.map(({ vendorCode, name }) => (
                            <Select.Option value={vendorCode} key={vendorCode}>
                                {name}
                            </Select.Option>
                        ))}
                    </Select>

                    <div className='flex gap-[20px]'>
                        <SortableContext
                            items={selectedGames.map(g => g._id || `${g.gameCode}-${g.vendorCode}`)}
                            strategy={rectSortingStrategy}
                            id="selected"
                        >
                            <DroppableContainer 
                                id="selected" 
                                label="Selected Games" 
                                isEmpty={selectedGames.length === 0}
                            >
                                {selectedGames.map((game) => {
                                    const id = game._id || `${game.gameCode}-${game.vendorCode}`
                                    return (
                                        <DraggableGameCard
                                            key={id}
                                            id={id}
                                            gameName={game.gameName}
                                            thumbnail={game.thumbnail}
                                        />
                                    )
                                })}
                            </DroppableContainer>
                        </SortableContext>

                        <SortableContext
                            items={availableGames.map(g => `${g.gameCode}-${g.vendorCode}`)}
                            strategy={rectSortingStrategy}
                            id="available"
                        >
                            <DroppableContainer 
                                id="available" 
                                label="Available Games"
                                isEmpty={availableGames.length === 0}
                            >
                                {availableGames.map((game) => {
                                    const id = `${game.gameCode}-${game.vendorCode}`
                                    return (
                                        <DraggableGameCard
                                            key={id}
                                            id={id}
                                            gameName={game.gameName}
                                            thumbnail={game.thumbnail}
                                        />
                                    )
                                })}
                            </DroppableContainer>
                        </SortableContext>
            </div>
        </div>
    </div>

            <DragOverlay>
                {activeGame ? (
                    <div className='w-[150px]  max-w-[150px]  m-3 flex flex-col overflow-hidden items-center justify-center gap-2 border-2 border-solid border-blue-500 rounded-md shadow-2xl bg-white'>
                        <div className='w-[150px] h-[100px] overflow-hidden flex items-center justify-center'>
                            <img src={activeGame.thumbnail} className='w-full' alt={activeGame.gameName} />
        </div>
                        <span className='text-normal text-center px-2 pb-2'>{activeGame.gameName}</span>
    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
